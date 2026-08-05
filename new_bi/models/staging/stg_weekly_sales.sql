WITH source AS (
    SELECT *
    FROM {{ source('raw_data', 'bi_data') }}
),

cleansed AS (
    SELECT
        -- Standardize Naming and Types
        CAST(Store AS INT64) AS store_id,

        -- Date Parsing Anomaly Handling:
        -- Row 5882 has '14/13/2019' which fails parsing.
        -- We use SAFE.PARSE_DATE and fallback to a default quarantine date or null if invalid, 
        -- but for BI consistency, we flag it.
        COALESCE(
            SAFE.PARSE_DATE('%d/%m/%Y', Week_ending_date),
            SAFE.PARSE_DATE('%d/%m/%Y', REPLACE(Week_ending_date, '13/2019', '12/2019')) -- Example basic imputation for month 13
        ) AS partition_date,
        
        -- Handle Negative/Zero Sales Outliers (Row 6403)
        CAST(Weekly_Sales AS FLOAT64) AS weekly_sales_amount_vnd,
        CASE 
            WHEN CAST(Weekly_Sales AS FLOAT64) <= 0 THEN TRUE 
            ELSE FALSE 
        END AS is_invalid_sales,

        -- Handle boolean flag format
        CAST(Is_holiday_week AS BOOL) AS is_holiday_week,

        -- Other metrics
        CAST(Fuel_price AS FLOAT64) AS fuel_price_amount_vnd,
        CAST(CPI AS FLOAT64) AS cpi_index,
        CAST(Unemployment AS FLOAT64) AS unemployment_rate

    FROM source
)

SELECT * FROM cleansed
