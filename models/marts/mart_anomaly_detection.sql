{{ config(
    materialized='table'
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
        
        -- calculate 52-week standard deviation
        STDDEV_SAMP(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
        ) AS rolling_52w_stddev,
        
        -- count weeks to ensure large enough sample size
        COUNT(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
        ) AS weeks_counted

    FROM {{ ref('fct_weekly_sales') }}
    WHERE is_invalid_sales = FALSE -- filter out invalid data
),
anomaly_scoring AS (
    SELECT 
        *,
        -- calculate safe z-score (avoid divide by zero)
        SAFE_DIVIDE((weekly_sales_amount_vnd - rolling_52w_avg), rolling_52w_stddev) AS z_score
    FROM rolling_stats
    WHERE weeks_counted > 10 -- ensure enough mature data before calculating z-score
)
SELECT 
    store_id,
    partition_date,
    weekly_sales_amount_vnd,
    rolling_52w_avg,
    rolling_52w_stddev,
    z_score,
    -- classify data into 3 distinct groups
    CASE 
        WHEN z_score > 3 THEN 'Positive Anomaly (Spike)'
        WHEN z_score < -3 THEN 'Negative Anomaly (Drop)'
        ELSE 'Normal' 
    END AS anomaly_type
FROM anomaly_scoring
