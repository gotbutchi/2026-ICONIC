{{ config(
    materialized='table'
) }}

WITH store_weekly_metrics AS (
    SELECT
        f.store_id,
        f.partition_date,
        f.weekly_sales_amount_vnd,
        s.cpi,
        s.unemployment_rate,
        
        -- 1. Baseline normal sales for this store across all time
        AVG(f.weekly_sales_amount_vnd) OVER (PARTITION BY f.store_id) AS baseline_sales_avg,
        
        -- 2. High unemployment threshold (Mean + 1 StdDev)
        AVG(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS avg_unemployment,
        STDDEV(s.unemployment_rate) OVER (PARTITION BY f.store_id) AS std_unemployment
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
        baseline_sales_avg,
        unemployment_rate,
        
        -- Flag high unemployment periods
        CASE 
            WHEN unemployment_rate > (avg_unemployment + std_unemployment) THEN TRUE 
            ELSE FALSE 
        END AS is_high_unemployment_period,
        
        -- Weekly resilience index (% vs Baseline)
        SAFE_DIVIDE(weekly_sales_amount_vnd, baseline_sales_avg) AS weekly_resilience_index
    FROM store_weekly_metrics
)

SELECT * FROM flagged_periods
