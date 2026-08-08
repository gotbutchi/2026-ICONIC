{{ config(
    materialized='table'
) }}

WITH weekly_lag AS (
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
    WHERE f.is_invalid_sales = FALSE
),
growth_calculation AS (
    SELECT 
        store_id,
        partition_date,
        weekly_sales_amount_vnd,
        fuel_price_amount_vnd,
        
        -- calculate revenue growth % & fuel price growth %
        SAFE_DIVIDE((weekly_sales_amount_vnd - prev_sales), prev_sales) AS sales_growth_pct,
        SAFE_DIVIDE((fuel_price_amount_vnd - prev_fuel), prev_fuel) AS fuel_growth_pct
    FROM weekly_lag
    WHERE prev_sales IS NOT NULL AND prev_fuel IS NOT NULL
)
SELECT 
    store_id,
    partition_date,
    weekly_sales_amount_vnd,
    fuel_price_amount_vnd,
    sales_growth_pct,
    fuel_growth_pct,
    
    -- assign economic trend labels
    CASE 
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct > 0 THEN 'Counter-Cyclical (Resilient)'
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct < 0 THEN 'Pro-Cyclical (Vulnerable)'
        ELSE 'Normal / Neutral'
    END AS economic_trend_type
FROM growth_calculation
