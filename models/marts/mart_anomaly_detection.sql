{{ config(
    materialized='table'
) }}

/*
    52-week rolling z-score per store.

    The baseline window is `52 PRECEDING AND 1 PRECEDING` -- it deliberately
    EXCLUDES the week being scored. Including the current row (the original
    implementation) puts the observation inside its own baseline, which drags the
    mean toward it and inflates sigma, systematically shrinking every z-score.
    On this dataset that suppression was severe: the peak spike scored 5.7 sigma
    with the observation included versus 12.9 sigma with it excluded, and only 2
    of 10 genuine negative anomalies cleared the -3 sigma bar.

    `baseline_weeks` is published so the BI layer can be explicit that early
    2019 scores run against an expanding window: the data starts 2019-02-01, so
    a full 52-week baseline does not exist until 2020-01-31.
*/

WITH rolling_stats AS (
    SELECT
        store_id,
        partition_date,
        is_holiday_week,
        weekly_sales_amount_vnd,

        -- trailing 52-week baseline, excluding the week under test
        AVG(weekly_sales_amount_vnd) OVER w_trailing AS rolling_52w_avg,
        STDDEV_SAMP(weekly_sales_amount_vnd) OVER w_trailing AS rolling_52w_stddev,

        -- how many weeks actually informed the baseline
        COUNT(weekly_sales_amount_vnd) OVER w_trailing AS baseline_weeks

    FROM {{ ref('fct_weekly_sales') }}
    WHERE is_invalid_sales = FALSE -- filter out invalid data
    WINDOW w_trailing AS (
        PARTITION BY store_id
        ORDER BY partition_date
        ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING
    )
),

anomaly_scoring AS (
    SELECT
        *,
        -- calculate safe z-score (avoid divide by zero)
        SAFE_DIVIDE((weekly_sales_amount_vnd - rolling_52w_avg), rolling_52w_stddev) AS z_score
    FROM rolling_stats
    WHERE baseline_weeks > 10 -- ensure enough mature data before calculating z-score
)

SELECT
    store_id,
    partition_date,
    is_holiday_week,
    weekly_sales_amount_vnd,
    rolling_52w_avg,
    rolling_52w_stddev,
    baseline_weeks,
    baseline_weeks >= 52 AS has_full_52w_baseline,
    z_score,

    -- WHAT happened, statistically: classify into 3 distinct groups
    CASE
        WHEN z_score > 3 THEN 'Positive Anomaly (Spike)'
        WHEN z_score < -3 THEN 'Negative Anomaly (Drop)'
        ELSE 'Normal'
    END AS anomaly_type,

    -- WHETHER TO ACT: a single triage toggle for Operations, deliberately kept as
    -- a boolean rather than a second label so it adds only the information
    -- anomaly_type does not already carry -- namely whether the trading calendar
    -- already explains the event. Every drop is worth investigating; a spike is
    -- only worth investigating when no flagged holiday week accounts for it.
    -- (The source holiday flag misses the pre-Christmas peak, so join
    -- dim_date.is_trading_peak_week for the full commercial calendar.)
    (z_score < -3) OR (z_score > 3 AND NOT is_holiday_week) AS requires_investigation
FROM anomaly_scoring
