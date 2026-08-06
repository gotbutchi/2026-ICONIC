{{ config(
    materialized='table',
    cluster_by=["store_id"]
) }}

WITH source AS (
    SELECT 
        store_id,
        partition_date AS valid_from,
        LEAD(partition_date) OVER (PARTITION BY store_id ORDER BY partition_date) AS valid_to,
        fuel_price_amount_vnd,
        cpi_index,
        unemployment_rate
    FROM {{ ref('stg_weekly_sales') }}
)

SELECT
    -- surrogate key for SCD Type 2
    FARM_FINGERPRINT(CONCAT(CAST(store_id AS STRING), '|', CAST(valid_from AS STRING))) AS store_sk,
    
    store_id,
    
    -- environment attributes (Type 2)
    fuel_price_amount_vnd,
    cpi_index,
    unemployment_rate,
    
    -- scd2 validity windows
    valid_from,
    COALESCE(valid_to, CAST('9999-12-31' AS DATE)) AS valid_to,
    CASE WHEN valid_to IS NULL THEN TRUE ELSE FALSE END AS is_current
    
FROM source
