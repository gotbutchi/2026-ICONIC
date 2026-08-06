{{ config(
    materialized='view'
) }}

WITH week_over_week AS (
    SELECT 
        f.store_id,
        f.partition_date,
        f.weekly_sales_amount_vnd,
        s.fuel_price_amount_vnd,
        
        -- get previous week's data
        LAG(f.weekly_sales_amount_vnd) OVER (PARTITION BY f.store_id ORDER BY f.partition_date) AS prev_sales,
        LAG(s.fuel_price_amount_vnd) OVER (PARTITION BY f.store_id ORDER BY f.partition_date) AS prev_fuel
        
    FROM {{ ref('fct_weekly_sales') }} f
    JOIN {{ ref('dim_store') }} s 
        ON f.store_sk = s.store_sk
)
SELECT 
    store_id,
    COUNT(partition_date) AS counter_cyclical_weeks_count
FROM week_over_week
WHERE prev_sales IS NOT NULL AND prev_fuel IS NOT NULL
  -- fuel price increased > 5%
  AND SAFE_DIVIDE((fuel_price_amount_vnd - prev_fuel), prev_fuel) > 0.05
  -- sales still increased
  AND weekly_sales_amount_vnd > prev_sales
GROUP BY store_id
ORDER BY counter_cyclical_weeks_count DESC
