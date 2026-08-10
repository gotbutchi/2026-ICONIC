WITH source AS (
    SELECT *
    FROM {{ source('raw_data', 'bi_data') }}
),

cleansed AS (
    SELECT
        -- standardizing naming & casting types. SAFE_CAST everywhere: a single
        -- malformed string must never abort the whole pipeline.
        SAFE_CAST(Store AS INT64) AS store_id,

        -- DQ-1: '14/13/2019' (store 42) cannot be repaired by string replacement --
        -- month 13 does not exist. The true week is recovered as 2019-06-14, which is
        -- the single missing Friday in store 42's 143-week sequence, corroborated
        -- independently by the row's own CPI (126.114, interpolating between
        -- 2019-06-07 and 2019-06-21) and unemployment (9.524, a value that only
        -- occurs for store 42 between 2019-03-29 and 2019-06-21).
        COALESCE(
            SAFE.PARSE_DATE('%d/%m/%Y', Week_ending_date),
            CASE WHEN Week_ending_date = '14/13/2019' THEN DATE '2019-06-14' END
        ) AS partition_date,

        -- lineage flag: was this date reconstructed rather than parsed?
        SAFE.PARSE_DATE('%d/%m/%Y', Week_ending_date) IS NULL AS is_date_recovered,

        -- DQ-2/DQ-3: keep the raw value (NULL-preserving) alongside the reporting
        -- value, so "missing" stays distinguishable from "zero" downstream.
        SAFE_CAST(Weekly_Sales AS FLOAT64) AS raw_weekly_sales_amount,
        COALESCE(SAFE_CAST(Weekly_Sales AS FLOAT64), 0.0) AS weekly_sales_amount_vnd,

        -- typed reason code beats a bare boolean when auditing exclusions
        CASE
            WHEN SAFE_CAST(Weekly_Sales AS FLOAT64) IS NULL THEN 'MISSING'
            WHEN SAFE_CAST(Weekly_Sales AS FLOAT64) < 0 THEN 'NEGATIVE'
            WHEN SAFE_CAST(Weekly_Sales AS FLOAT64) = 0 THEN 'ZERO'
            ELSE 'VALID'
        END AS sales_quality_code,

        -- accept 0/1, TRUE/FALSE or NULL from the source without erroring
        COALESCE(
            SAFE_CAST(SAFE_CAST(Is_holiday_week AS INT64) AS BOOL),
            SAFE_CAST(Is_holiday_week AS BOOL),
            FALSE
        ) AS is_holiday_week,

        SAFE_CAST(Fuel_price AS FLOAT64) AS fuel_price_amount_vnd,
        SAFE_CAST(CPI AS FLOAT64) AS cpi,
        SAFE_CAST(Unemployment AS FLOAT64) AS unemployment_rate

    FROM source
)

SELECT
    *,
    sales_quality_code <> 'VALID' AS is_invalid_sales
FROM cleansed
