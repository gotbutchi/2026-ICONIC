{{ config(
    materialized='table',
    cluster_by=["store_id"]
) }}

/*
    Point-in-time store dimension.

    Honest scope note: the tracked economic attributes (fuel price, CPI,
    unemployment) are re-published by the source every week, so this table
    versions weekly by construction -- it is a weekly point-in-time snapshot
    rather than a classic slowly-changing dimension. That is a property of the
    feed, not of the modelling. The SCD Type 2 mechanics (surrogate key,
    valid_from / valid_to, is_current) are what make the point-in-time join from
    the fact table exact, which is why they are retained.

    Next iteration (deliberately deferred -- a live Looker dashboard reads these
    columns, so the change was kept additive): split into a static `dim_store`
    (store_id, region) plus a `fct_store_economics` at week grain, since these
    indicators are weekly measures, not store attributes.
*/

WITH source AS (
    SELECT
        store_id,
        partition_date AS valid_from,
        LEAD(partition_date) OVER (PARTITION BY store_id ORDER BY partition_date) AS valid_to,
        fuel_price_amount_vnd,
        cpi,
        unemployment_rate
    FROM {{ ref('stg_weekly_sales') }}
),

region AS (
    SELECT
        store_id,
        region_id,
        region_name
    FROM {{ ref('store_region') }}
)

SELECT
    -- surrogate key for SCD Type 2
    FARM_FINGERPRINT(CONCAT(CAST(s.store_id AS STRING), '|', CAST(s.valid_from AS STRING))) AS store_sk,

    s.store_id,

    -- static store attributes (Type 1). Enables the region-grain joins proposed
    -- in Stage 1.3 (dim_marketing_spend, dim_competitor_pricing) without
    -- fanning out the fact table.
    r.region_id,
    r.region_name,

    -- environment attributes (Type 2)
    s.fuel_price_amount_vnd,
    s.cpi,
    s.unemployment_rate,

    -- scd2 validity windows
    s.valid_from,
    COALESCE(s.valid_to, CAST('9999-12-31' AS DATE)) AS valid_to,
    CASE WHEN s.valid_to IS NULL THEN TRUE ELSE FALSE END AS is_current

FROM source s
LEFT JOIN region r ON s.store_id = r.store_id
