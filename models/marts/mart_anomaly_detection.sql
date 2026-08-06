{{ config(
    materialized='view'
) }}

WITH rolling_stats AS (
    SELECT 
        store_id,
        partition_date,
        weekly_sales_amount_vnd,
        
        -- calculate 52-week rolling average (51 preceding weeks + current week)
        AVG(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
        ) AS rolling_52w_avg,
        
        -- calculate 52-week rolling standard deviation
        STDDEV_SAMP(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
        ) AS rolling_52w_stddev,
        
        -- count weeks to ensure enough data (avoid noise in early weeks)
        COUNT(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
        ) AS weeks_counted

    FROM {{ ref('fct_weekly_sales') }}
)
SELECT 
    store_id,
    partition_date,
    weekly_sales_amount_vnd,
    rolling_52w_avg,
    rolling_52w_stddev,
    -- calculate z-score based on rolling stats
    SAFE_DIVIDE((weekly_sales_amount_vnd - rolling_52w_avg), rolling_52w_stddev) AS z_score
FROM rolling_stats
-- only evaluate when there is enough historical data (e.g. > 10 weeks) and z_score > 3
WHERE weeks_counted > 10 
  AND (weekly_sales_amount_vnd - rolling_52w_avg) > (3 * rolling_52w_stddev)
ORDER BY z_score DESC
