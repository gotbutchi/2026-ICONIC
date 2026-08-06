{{ config(
    materialized='view'
) }}

WITH monthly_sales AS (
    SELECT
        store_id,
        year_num,
        month_num,
        SUM(weekly_sales_amount_vnd) AS total_monthly_sales
    FROM {{ ref('fct_weekly_sales') }}
    JOIN {{ ref('dim_date') }} ON fct_weekly_sales.partition_date = dim_date.date_id
    GROUP BY 1, 2, 3
),

growth_calc AS (
    SELECT
        store_id,
        year_num,
        month_num,
        total_monthly_sales,
        LAG(total_monthly_sales) OVER (PARTITION BY store_id ORDER BY year_num, month_num) AS prev_month_sales
    FROM monthly_sales
),

turnaround_metrics AS (
    SELECT
        store_id,
        year_num,
        month_num,
        total_monthly_sales,
        prev_month_sales,
        (total_monthly_sales - prev_month_sales) AS sales_growth_abs,
        SAFE_DIVIDE((total_monthly_sales - prev_month_sales), prev_month_sales) AS sales_growth_pct
    FROM growth_calc
    WHERE prev_month_sales IS NOT NULL
)

SELECT
    store_id,
    year_num,
    month_num,
    total_monthly_sales,
    prev_month_sales,
    sales_growth_abs,
    sales_growth_pct,
    RANK() OVER (ORDER BY sales_growth_abs DESC) AS comeback_rank_abs,
    RANK() OVER (ORDER BY sales_growth_pct DESC) AS comeback_rank_pct
FROM turnaround_metrics
ORDER BY comeback_rank_abs ASC
LIMIT 10
