{{ config(
    materialized='table'
) }}

WITH store_stats AS (
    SELECT
        store_id,
        AVG(weekly_sales_amount_vnd) AS avg_sales,
        STDDEV(weekly_sales_amount_vnd) AS stddev_sales
    FROM {{ ref('fct_weekly_sales') }}
    WHERE is_invalid_sales = FALSE
    GROUP BY 1
),

anomalies AS (
    SELECT
        f.store_id,
        f.partition_date,
        f.weekly_sales_amount_vnd,
        s.avg_sales,
        s.stddev_sales,
        -- calculate z-score
        ABS(f.weekly_sales_amount_vnd - s.avg_sales) / NULLIF(s.stddev_sales, 0) AS z_score
    FROM {{ ref('fct_weekly_sales') }} f
    JOIN store_stats s ON f.store_id = s.store_id
    WHERE f.is_invalid_sales = FALSE
)

SELECT
    store_id,
    partition_date,
    weekly_sales_amount_vnd,
    avg_sales,
    z_score,
    CASE 
        WHEN z_score > 3 AND weekly_sales_amount_vnd > avg_sales THEN 'Positive Anomaly (Spike)'
        WHEN z_score > 3 AND weekly_sales_amount_vnd < avg_sales THEN 'Negative Anomaly (Drop)'
        ELSE 'Normal'
    END AS anomaly_type
FROM anomalies
WHERE z_score > 3
ORDER BY z_score DESC
