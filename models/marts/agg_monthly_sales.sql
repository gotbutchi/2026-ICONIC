{{ config(
    materialized='table'
) }}

WITH fct AS (
    SELECT * FROM {{ ref('fct_weekly_sales') }}
)

SELECT
    EXTRACT(YEAR FROM partition_date) AS year_num,
    EXTRACT(MONTH FROM partition_date) AS month_num,
    
    SUM(weekly_sales_amount_vnd) AS total_monthly_sales,
    
    -- distinct store hll sketch
    HLL_COUNT.INIT(CAST(store_id AS STRING)) AS hll_store_id
    
FROM fct
GROUP BY 1, 2
