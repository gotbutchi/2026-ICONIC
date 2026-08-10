{{ config(
    materialized='table'
) }}

/*
    Resilience of each store during high-unemployment weeks
    (defined per store as unemployment > its own mean + 1 stddev).

    Two baselines are published, and the difference between them matters:

      * resilience_index_alltime  -- sales / the store's whole-period average.
        Simple, but it looks ahead and does not detrend, so a store that merely
        grew over time scores above 100% regardless of unemployment.
      * resilience_index_trailing -- sales / the store's trailing 52-week average.
        Time-local and causal; this is the one to trust for a claim about
        behaviour DURING a downturn.

    On this dataset the choice reverses the answer. Store 35 scores 126% on the
    all-period baseline but 99.4% on the trailing baseline -- its apparent
    "down-trading" effect is a trend artifact. Stores 5 (110.6%) and 29 (107.7%)
    survive both.
*/

WITH store_weekly_metrics AS (
    SELECT
        f.store_id,
        f.partition_date,
        f.weekly_sales_amount_vnd,
        s.cpi,
        s.unemployment_rate,

        -- 1a. whole-period baseline (as originally shipped -- retained for continuity)
        AVG(f.weekly_sales_amount_vnd) OVER (PARTITION BY f.store_id) AS baseline_sales_alltime,

        -- 1b. trailing 52-week baseline, excluding the current week
        AVG(f.weekly_sales_amount_vnd) OVER (
            PARTITION BY f.store_id
            ORDER BY f.partition_date
            ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING
        ) AS baseline_sales_trailing_52w,

        -- 2. high unemployment threshold (Mean + 1 StdDev)
        AVG(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS avg_unemployment,
        STDDEV_SAMP(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS std_unemployment
    FROM {{ ref('fct_weekly_sales') }} f
    JOIN {{ ref('dim_store') }} s
      ON f.store_sk = s.store_sk
    WHERE f.is_invalid_sales = FALSE
),

flagged_periods AS (
    SELECT
        store_id,
        partition_date,
        weekly_sales_amount_vnd,
        unemployment_rate,
        baseline_sales_alltime,
        baseline_sales_trailing_52w,

        -- Flag high unemployment periods
        CASE
            WHEN unemployment_rate > (avg_unemployment + std_unemployment) THEN TRUE
            ELSE FALSE
        END AS is_high_unemployment_period,

        -- Weekly resilience index (% vs Baseline)
        SAFE_DIVIDE(weekly_sales_amount_vnd, baseline_sales_alltime) AS resilience_index_alltime,
        SAFE_DIVIDE(weekly_sales_amount_vnd, baseline_sales_trailing_52w) AS resilience_index_trailing
    FROM store_weekly_metrics
)

SELECT
    *,
    -- kept under the original name so existing dashboard fields keep resolving
    resilience_index_alltime AS weekly_resilience_index
FROM flagged_periods
