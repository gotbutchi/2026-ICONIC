{{ config(
    materialized='table',
    partition_by={
      "field": "partition_date",
      "data_type": "date",
      "granularity": "month"
    },
    cluster_by=["store_id"]
) }}

WITH staging AS (
    SELECT * FROM {{ ref('stg_weekly_sales') }}
),

-- lookup the correct store_sk at the time of the sale
store_sk_lookup AS (
    SELECT
        s.store_id,
        s.store_sk,
        s.valid_from,
        s.valid_to
    FROM {{ ref('dim_store') }} s
)

SELECT
    -- primary key
    FARM_FINGERPRINT(CONCAT(CAST(stg.store_id AS STRING), '|', CAST(stg.partition_date AS STRING))) AS sales_sk,
    
    -- fk to dimensions (SK for dim_store, NK for dim_date)
    sk.store_sk,
    stg.store_id,
    stg.partition_date,
    stg.is_holiday_week,
    
    -- metrics
    stg.weekly_sales_amount_vnd,
    stg.is_invalid_sales,
    
    CURRENT_TIMESTAMP() AS loaded_at
    
FROM staging stg
LEFT JOIN store_sk_lookup sk
    ON stg.store_id = sk.store_id
    AND stg.partition_date >= sk.valid_from
    AND stg.partition_date < sk.valid_to
