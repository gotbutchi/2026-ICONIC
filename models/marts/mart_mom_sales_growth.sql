{{ config(
    materialized='view'
) }}

/*
    Month-over-month growth per store.

    Two fixes versus the original: the `RANK() ... LIMIT 10` has been removed
    (ranking belongs in the BI layer, and a hardcoded top-10 blocked every date
    filter downstream), and comparisons that span a partial or unequal-length
    month are now flagged rather than reported as growth. Weekly data rolls into
    4- or 5-week months, so an unguarded MoM figure reports a ~20% swing whenever
    the week count changes.

    Filter on `is_comparable = TRUE` for any figure that goes in front of a
    stakeholder.
*/

WITH monthly_sales AS (
    SELECT
        f.store_id,
        d.year_num,
        d.month_num,
        d.year_month,
        SUM(f.weekly_sales_amount_vnd) AS total_monthly_sales,
        COUNT(DISTINCT f.partition_date) AS weeks_in_month
    FROM {{ ref('fct_weekly_sales') }} f
    JOIN {{ ref('dim_date') }} d
        ON f.partition_date = d.date_id
    WHERE f.is_invalid_sales = FALSE
    GROUP BY 1, 2, 3, 4
),

partial_months AS (
    SELECT year_num, month_num, is_partial_month
    FROM {{ ref('agg_monthly_sales') }}
),

growth_calc AS (
    SELECT
        m.*,
        p.is_partial_month,
        LAG(m.total_monthly_sales) OVER w AS prev_month_sales,
        LAG(m.weeks_in_month) OVER w AS prev_weeks_in_month,
        LAG(p.is_partial_month) OVER w AS prev_is_partial_month
    FROM monthly_sales m
    LEFT JOIN partial_months p
        ON m.year_num = p.year_num
       AND m.month_num = p.month_num
    WINDOW w AS (PARTITION BY m.store_id ORDER BY m.year_num, m.month_num)
)

SELECT
    store_id,
    year_num,
    month_num,
    year_month,
    total_monthly_sales,
    prev_month_sales,
    weeks_in_month,
    prev_weeks_in_month,

    (total_monthly_sales - prev_month_sales) AS sales_growth_abs,
    SAFE_DIVIDE((total_monthly_sales - prev_month_sales), prev_month_sales) AS sales_growth_pct,

    -- like-for-like: same number of trading weeks, and neither month truncated
    (weeks_in_month = prev_weeks_in_month
        AND NOT COALESCE(is_partial_month, TRUE)
        AND NOT COALESCE(prev_is_partial_month, TRUE)) AS is_comparable,

    -- week-count-neutral alternative, valid even across 4- vs 5-week months
    SAFE_DIVIDE(
        SAFE_DIVIDE(total_monthly_sales, weeks_in_month)
            - SAFE_DIVIDE(prev_month_sales, prev_weeks_in_month),
        SAFE_DIVIDE(prev_month_sales, prev_weeks_in_month)
    ) AS avg_weekly_growth_pct

FROM growth_calc
WHERE prev_month_sales IS NOT NULL
