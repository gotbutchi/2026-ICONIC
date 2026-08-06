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
)

SELECT
    -- primary key
    FARM_FINGERPRINT(CONCAT(CAST(store_id AS STRING), '|', CAST(partition_date AS STRING))) AS sales_sk,
    
    -- fk to dimensions
    store_id,
    partition_date,
    is_holiday_week,
    
    -- metrics
    weekly_sales_amount_vnd,
    is_invalid_sales,
    
    CURRENT_TIMESTAMP() AS loaded_at
    
FROM staging
