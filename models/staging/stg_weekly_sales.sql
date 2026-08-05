WITH source AS (
    SELECT *
    FROM {{ source('raw_data', 'bi_data') }}
),

cleansed AS (
    SELECT
        -- standardizing naming & casting types
        CAST(Store AS INT64) AS store_id,

        -- handle invalid date '14/13/2019' from raw data
        COALESCE(
            SAFE.PARSE_DATE('%d/%m/%Y', Week_ending_date),
            SAFE.PARSE_DATE('%d/%m/%Y', REPLACE(Week_ending_date, '13/2019', '12/2019'))
        ) AS partition_date,
        
        -- cast and flag negative sales
        CAST(Weekly_Sales AS FLOAT64) AS weekly_sales_amount_vnd,
        CAST(Weekly_Sales AS FLOAT64) <= 0 AS is_invalid_sales,

        CAST(Is_holiday_week AS BOOL) AS is_holiday_week,

        CAST(Fuel_price AS FLOAT64) AS fuel_price_amount_vnd,
        CAST(CPI AS FLOAT64) AS cpi_index,
        CAST(Unemployment AS FLOAT64) AS unemployment_rate

    FROM source
)

SELECT * FROM cleansed
