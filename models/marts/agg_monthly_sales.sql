{{ config(
    materialized='table'
) }}

/*
    Monthly rollup. Two things worth knowing before using this table:

    1. Invalid sales rows are excluded here as well, so totals reconcile with
       every mart (the original version summed them, which let a -791,835 VND
       correction leak into a reported month).
    2. Weekly data does not roll into calendar months cleanly -- a month holds 4
       or 5 week-ending dates, and the feed's first and last months are only
       partially covered. `weeks_in_month` and `is_partial_month` are published so
       month-over-month comparisons can exclude non-comparable periods instead of
       silently reporting a "decline" that is really a missing week.
*/

WITH fct AS (
    SELECT
        partition_date,
        store_id,
        weekly_sales_amount_vnd
    FROM {{ ref('fct_weekly_sales') }}
    WHERE is_invalid_sales = FALSE
),

feed_bounds AS (
    SELECT
        MIN(partition_date) AS feed_start,
        MAX(partition_date) AS feed_end
    FROM fct
),

monthly AS (
    SELECT
        EXTRACT(YEAR FROM partition_date) AS year_num,
        EXTRACT(MONTH FROM partition_date) AS month_num,
        FORMAT_DATE('%Y-%m', DATE_TRUNC(partition_date, MONTH)) AS year_month,
        DATE_TRUNC(partition_date, MONTH) AS month_start,

        SUM(weekly_sales_amount_vnd) AS total_monthly_sales,
        COUNT(DISTINCT partition_date) AS weeks_in_month,

        -- 45 stores: an exact distinct count is both cheaper and correct here.
        -- (An HLL sketch, as originally used, is for high-cardinality keys and
        -- was never merged downstream.)
        COUNT(DISTINCT store_id) AS active_stores
    FROM fct
    GROUP BY 1, 2, 3, 4
)

SELECT
    m.year_num,
    m.month_num,
    m.year_month,
    m.total_monthly_sales,
    m.weeks_in_month,
    m.active_stores,
    SAFE_DIVIDE(m.total_monthly_sales, m.weeks_in_month) AS avg_weekly_sales_in_month,

    -- the feed does not cover this whole calendar month, so do not compare it MoM
    (m.month_start < DATE_TRUNC(b.feed_start, MONTH))
        OR (m.month_start = DATE_TRUNC(b.feed_start, MONTH) AND b.feed_start > m.month_start)
        OR (LAST_DAY(m.month_start) > b.feed_end) AS is_partial_month

FROM monthly m
CROSS JOIN feed_bounds b
