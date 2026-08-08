{{ config(
    materialized='view'
) }}

WITH weekly_growth AS (
    SELECT 
        store_id,
        partition_date,
        weekly_sales_amount_vnd,
        LAG(weekly_sales_amount_vnd) OVER (PARTITION BY store_id ORDER BY partition_date) AS prev_week_sales
    FROM {{ ref('fct_weekly_sales') }}
    WHERE is_invalid_sales = FALSE  -- remove meaningless data
),
flag_negative_growth AS (
    SELECT 
        *,
        (weekly_sales_amount_vnd - prev_week_sales) AS current_growth,
        CASE WHEN (weekly_sales_amount_vnd - prev_week_sales) <= 0 THEN TRUE ELSE FALSE END AS is_negative_growth
    FROM weekly_growth
),
next_4_weeks_calc AS (
    SELECT 
        *,
        -- calculate total sales for the next 4 weeks
        SUM(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING
        ) AS cumulative_sales_next_4_weeks,
        
        -- calculate cumulative sales of the past 4 weeks for ranking
        SUM(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS cumulative_sales_past_4_weeks,

        -- check if there are 4 future weeks available (Prevent NULLs)
        COUNT(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id 
            ORDER BY partition_date 
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING
        ) AS future_weeks_count
    FROM flag_negative_growth
)
SELECT 
    store_id,
    partition_date AS comeback_start_date,
    cumulative_sales_next_4_weeks,
    (cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks) AS absolute_comeback_growth,
    ROW_NUMBER() OVER (
        ORDER BY (cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks) DESC
    ) AS comeback_rank
FROM next_4_weeks_calc
WHERE is_negative_growth = TRUE
  AND future_weeks_count = 4 -- filter out to ensure 4 future weeks available (No NULLs)
ORDER BY absolute_comeback_growth DESC
