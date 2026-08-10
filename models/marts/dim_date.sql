{{ config(
    materialized='table'
) }}

/*
    Calendar spine with trading-calendar context.

    DQ-4: the source `Is_holiday_week` flag is calendar-correct but commercially
    inverted around Christmas. It marks the week ending 2019-12-27 (network sales
    0.86x an average week -- BELOW average) while leaving the week ending
    2019-12-20 unflagged (1.72x an average week -- the single largest trading week
    in the dataset). The same inversion repeats in 2020: 12-25 flagged at 0.98x,
    12-18 unflagged at 1.63x. Segmenting on the raw flag alone would suggest
    Christmas depresses sales. `is_pre_christmas_week` and `is_trading_peak_week`
    restore the commercial reading.
*/

WITH date_spine AS (
    SELECT date_day
    FROM UNNEST(GENERATE_DATE_ARRAY('2019-01-01', '2026-12-31')) AS date_day
),

-- pull holiday flags from source data and deduplicate to one flag per date
holiday_flags AS (
    SELECT
        partition_date,
        MAX(CASE WHEN is_holiday_week THEN TRUE ELSE FALSE END) AS is_holiday
    FROM {{ ref('stg_weekly_sales') }}
    GROUP BY 1
)

SELECT
    ds.date_day AS date_id,
    EXTRACT(YEAR FROM ds.date_day) AS year_num,
    EXTRACT(MONTH FROM ds.date_day) AS month_num,
    EXTRACT(WEEK FROM ds.date_day) AS week_num,
    EXTRACT(ISOWEEK FROM ds.date_day) AS iso_week_num,
    EXTRACT(DAYOFWEEK FROM ds.date_day) AS day_of_week_num,
    FORMAT_DATE('%Y-%m', ds.date_day) AS year_month,
    CASE WHEN EXTRACT(DAYOFWEEK FROM ds.date_day) IN (1, 7) THEN TRUE ELSE FALSE END AS is_weekend,

    -- flag as published by the source feed (week grain, joined on week-ending date)
    COALESCE(hf.is_holiday, FALSE) AS is_holiday,

    -- the peak trading week the source flag misses
    CASE
        WHEN EXTRACT(MONTH FROM ds.date_day) = 12
         AND EXTRACT(DAY FROM ds.date_day) BETWEEN 15 AND 24
        THEN TRUE ELSE FALSE
    END AS is_pre_christmas_week,

    CASE
        WHEN COALESCE(hf.is_holiday, FALSE)
          OR (EXTRACT(MONTH FROM ds.date_day) = 12
              AND EXTRACT(DAY FROM ds.date_day) BETWEEN 15 AND 24)
        THEN TRUE ELSE FALSE
    END AS is_trading_peak_week

FROM date_spine ds
LEFT JOIN holiday_flags hf ON ds.date_day = hf.partition_date
