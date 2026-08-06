{{ config(
    materialized='table'
) }}

WITH date_spine AS (
    SELECT date_day
    FROM UNNEST(GENERATE_DATE_ARRAY('2000-01-01', '2030-12-31')) AS date_day
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
    EXTRACT(DAYOFWEEK FROM ds.date_day) AS day_of_week_num,
    FORMAT_DATE('%Y-%m', ds.date_day) AS year_month,
    CASE WHEN EXTRACT(DAYOFWEEK FROM ds.date_day) IN (1, 7) THEN TRUE ELSE FALSE END AS is_weekend,
    COALESCE(hf.is_holiday, FALSE) AS is_holiday
FROM date_spine ds
LEFT JOIN holiday_flags hf ON ds.date_day = hf.partition_date
