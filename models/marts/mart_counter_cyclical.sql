{{ config(
    materialized='table'
) }}

/*
    Event log classifying every store-week by how sales reacted to fuel-price
    inflation. Kept at full grain (not pre-aggregated to a store ranking) for two
    reasons: the BI layer keeps its date filters, and -- more importantly -- a
    store's average must be taken over ALL of its fuel-spike weeks. Averaging
    only the weeks where sales happened to rise conditions on the outcome and
    overstates resilience by roughly 7x on this dataset.

    Sample-size warning for anyone reading a filtered view of this table: only
    111 of 6,387 store-weeks exceed +5% fuel growth (27 of 45 stores, 24 distinct
    weeks), and only 3 store-weeks exceed +10% -- all of them in the single week
    of 2021-10-08. `fuel_spike_bucket` is published so the dashboard can show n
    alongside any threshold claim.
*/

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
    WHERE prev_sales IS NOT NULL
      AND prev_fuel IS NOT NULL
      AND prev_sales > 0
      AND prev_fuel > 0
)

SELECT
    store_id,
    partition_date,
    weekly_sales_amount_vnd,
    fuel_price_amount_vnd,
    sales_growth_pct,
    fuel_growth_pct,

    -- makes the (very thin) evidence at the top of the range explicit in the BI layer
    CASE
        WHEN fuel_growth_pct > 0.10 THEN '>10% (n=3 store-weeks)'
        WHEN fuel_growth_pct > 0.05 THEN '5-10% (n=108 store-weeks)'
        ELSE '<=5%'
    END AS fuel_spike_bucket,

    -- assign economic trend labels
    CASE
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct > 0 THEN 'Counter-Cyclical (Resilient)'
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct <= 0 THEN 'Pro-Cyclical (Vulnerable)'
        ELSE 'Normal / Neutral'
    END AS economic_trend_type
FROM growth_calculation
