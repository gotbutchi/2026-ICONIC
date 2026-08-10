{{ config(
    materialized='table'
) }}

/*
    Event log of every negative-growth week and the 4-week trajectory that
    followed it. Ranking is deliberately left to the BI layer rather than
    hardcoded with LIMIT 1, so the same model answers "Comeback King" and
    "Fail King".

    Both an absolute and a relative measure are published. Absolute VND is what
    the brief asks for, but on its own it mostly ranks store size: the top 10 by
    absolute recovery have an average store-size rank of 7.4 out of 45, versus
    27.4 for the top 10 by percentage. Publishing both lets the dashboard show
    the headline number and the size-neutral one side by side.
*/

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
        -- total sales for the next 4 weeks
        SUM(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id
            ORDER BY partition_date
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING
        ) AS cumulative_sales_next_4_weeks,

        -- cumulative sales of the trailing 4 weeks, used as the comparison base
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
    cumulative_sales_past_4_weeks,
    cumulative_sales_next_4_weeks,

    -- headline measure requested by the brief
    (cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks) AS absolute_comeback_growth,

    -- size-neutral measure, so a small store's genuine turnaround is comparable
    -- to a flagship's
    SAFE_DIVIDE(
        cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks,
        cumulative_sales_past_4_weeks
    ) AS pct_comeback_growth

FROM next_4_weeks_calc
WHERE is_negative_growth = TRUE
  AND future_weeks_count = 4 -- ensure 4 future weeks available (No NULLs)
