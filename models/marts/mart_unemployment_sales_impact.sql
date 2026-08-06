{{ config(
    materialized='view'
) }}

WITH store_weekly_metrics AS (
    SELECT
        f.store_id,
        f.partition_date,
        f.weekly_sales_amount_vnd,
        s.cpi,
        s.unemployment_rate,
        AVG(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS avg_unemployment,
        STDDEV(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS std_unemployment
    FROM {{ ref('fct_weekly_sales') }} f
    JOIN {{ ref('dim_store') }} s 
      ON f.store_sk = s.store_sk
    WHERE f.is_invalid_sales = FALSE
),

downturn_periods AS (
    SELECT
        *,
        CASE 
            WHEN unemployment_rate > (avg_unemployment + std_unemployment) THEN TRUE 
            ELSE FALSE 
        END AS is_downturn_period
    FROM store_weekly_metrics
),

counter_cyclical_performance AS (
    SELECT
        store_id,
        COUNT(partition_date) AS downturn_weeks_count,
        AVG(weekly_sales_amount_vnd) AS avg_sales_during_downturn,
        SUM(weekly_sales_amount_vnd) AS total_sales_during_downturn
    FROM downturn_periods
    WHERE is_downturn_period = TRUE
    GROUP BY 1
)

SELECT
    store_id,
    downturn_weeks_count,
    avg_sales_during_downturn,
    total_sales_during_downturn,
    RANK() OVER (ORDER BY avg_sales_during_downturn DESC) AS resilience_rank
FROM counter_cyclical_performance
ORDER BY resilience_rank ASC
