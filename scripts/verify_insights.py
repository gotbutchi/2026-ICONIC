"""
Reproducibility harness: recompute every insight claimed in docs/report/ directly
from raw/bia_data.csv, using DuckDB to mirror the dbt model logic 1:1.

Purpose: no number reaches a report or a slide unless this script prints it.
Run:  scripts/venv/bin/python scripts/verify_insights.py
"""

import os

import duckdb

RAW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "raw", "bia_data.csv")

con = duckdb.connect()
con.execute(f"""
CREATE VIEW src AS
SELECT * FROM read_csv('{RAW}', header=true, all_varchar=true)
""")

# ---------------------------------------------------------------- staging
# Mirrors models/staging/stg_weekly_sales.sql (corrected date recovery).
con.execute("""
CREATE TABLE stg AS
WITH cleansed AS (
    SELECT
        CAST(Store AS INTEGER) AS store_id,

        -- '14/13/2019' (store 42) is unrecoverable by string replacement: month 13
        -- is impossible. Recovered as 2019-06-14 -- the single gap in store 42's
        -- 143-week sequence -- and corroborated by the row's own CPI/unemployment.
        COALESCE(
            CAST(try_strptime(Week_ending_date, '%d/%m/%Y') AS DATE),
            CASE WHEN Week_ending_date = '14/13/2019' THEN DATE '2019-06-14' END
        ) AS partition_date,

        TRY_CAST(Weekly_Sales AS DOUBLE) AS raw_sales,
        COALESCE(TRY_CAST(Weekly_Sales AS DOUBLE), 0.0) AS weekly_sales_amount,
        COALESCE(TRY_CAST(Is_holiday_week AS INTEGER), 0) = 1 AS is_holiday_week,
        TRY_CAST(Fuel_price AS DOUBLE) AS fuel_price,
        TRY_CAST(CPI AS DOUBLE) AS cpi,
        TRY_CAST(Unemployment AS DOUBLE) AS unemployment_rate
    FROM src
)
SELECT
    *,
    (raw_sales IS NULL OR raw_sales <= 0) AS is_invalid_sales
FROM cleansed
""")


def q(sql):
    return con.execute(sql).fetchall()


def show(title, sql, limit=None):
    print(f"\n{'=' * 78}\n{title}\n{'=' * 78}")
    rows = q(sql)
    cols = [d[0] for d in con.description]
    print(" | ".join(cols))
    for r in (rows[:limit] if limit else rows):
        print(" | ".join("" if v is None else (f"{v:,.4f}" if isinstance(v, float) else str(v)) for v in r))
    return rows


# ---------------------------------------------------------------- 0. audit
show("0. SOURCE AUDIT", """
SELECT
    COUNT(*) AS rows_total,
    COUNT(DISTINCT store_id) AS stores,
    COUNT(DISTINCT partition_date) AS weeks,
    MIN(partition_date) AS first_week,
    MAX(partition_date) AS last_week,
    SUM(CASE WHEN raw_sales IS NULL THEN 1 ELSE 0 END) AS null_sales,
    SUM(CASE WHEN raw_sales < 0 THEN 1 ELSE 0 END) AS negative_sales,
    SUM(CASE WHEN fuel_price IS NULL THEN 1 ELSE 0 END) AS null_fuel,
    SUM(CASE WHEN is_invalid_sales THEN 1 ELSE 0 END) AS invalid_flagged
FROM stg
""")

show("0b. CADENCE CHECK (every week must end on a Friday)", """
SELECT DISTINCT dayname(partition_date) AS weekday, COUNT(*) AS n
FROM stg GROUP BY 1
""")

# ---------------------------------------------------------------- 1. anomaly
con.execute("""
CREATE TABLE anomaly AS
WITH base AS (
    SELECT store_id, partition_date, weekly_sales_amount, is_holiday_week
    FROM stg WHERE is_invalid_sales = FALSE
),
stats AS (
    SELECT *,
        -- CURRENT (ships today): observation is inside its own baseline
        AVG(weekly_sales_amount) OVER w_cur AS avg_cur,
        STDDEV_SAMP(weekly_sales_amount) OVER w_cur AS sd_cur,
        COUNT(*) OVER w_cur AS n_cur,
        -- CORRECTED: baseline excludes the week being scored
        AVG(weekly_sales_amount) OVER w_fix AS avg_fix,
        STDDEV_SAMP(weekly_sales_amount) OVER w_fix AS sd_fix,
        COUNT(*) OVER w_fix AS n_fix
    FROM base
    WINDOW
        w_cur AS (PARTITION BY store_id ORDER BY partition_date ROWS BETWEEN 51 PRECEDING AND CURRENT ROW),
        w_fix AS (PARTITION BY store_id ORDER BY partition_date ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING)
)
SELECT *,
    (weekly_sales_amount - avg_cur) / sd_cur AS z_cur,
    (weekly_sales_amount - avg_fix) / sd_fix AS z_fix
FROM stats
WHERE n_cur > 10
""")

show("1a. FLASH-SALE EVENTS: how many, and does the fix change the count?", """
SELECT
    SUM(CASE WHEN z_cur > 3 THEN 1 ELSE 0 END) AS spikes_current_logic,
    SUM(CASE WHEN z_fix > 3 AND n_fix > 10 THEN 1 ELSE 0 END) AS spikes_corrected_logic,
    SUM(CASE WHEN z_cur < -3 THEN 1 ELSE 0 END) AS drops_current_logic,
    SUM(CASE WHEN z_fix < -3 AND n_fix > 10 THEN 1 ELSE 0 END) AS drops_corrected_logic,
    MAX(z_cur) AS max_z_current, MAX(z_fix) AS max_z_corrected
FROM anomaly
""")

show("1b. WHICH WEEK ACTUALLY DOMINATES? (all spikes, corrected z-score)", """
SELECT partition_date, COUNT(*) AS stores_flagged,
       ROUND(AVG(z_fix), 2) AS avg_z, ROUND(MAX(z_fix), 2) AS max_z,
       ANY_VALUE(is_holiday_week) AS flagged_holiday_week
FROM anomaly WHERE z_fix > 3 AND n_fix > 10
GROUP BY 1 ORDER BY stores_flagged DESC, partition_date
""")

show("1c. TOP 10 INDIVIDUAL SPIKES (the 'Black Friday 80%' claim)", """
SELECT store_id, partition_date, ROUND(z_fix, 2) AS z_corrected, ROUND(z_cur, 2) AS z_as_shipped,
       ROUND(weekly_sales_amount) AS sales, ROUND(avg_fix) AS baseline_52w
FROM anomaly WHERE n_fix > 10 ORDER BY z_fix DESC LIMIT 10
""")

show("1d. NEGATIVE ANOMALIES (the 'Store 36 operational failure' claim)", """
SELECT store_id, partition_date, ROUND(z_fix, 2) AS z_corrected, ROUND(z_cur, 2) AS z_as_shipped,
       ROUND(weekly_sales_amount) AS sales, ROUND(avg_fix) AS baseline_52w
FROM anomaly WHERE (z_fix < -3 OR z_cur < -3) AND n_fix > 10 ORDER BY z_fix
""")

show("1e. BASELINE MATURITY: a true 52w baseline only exists from when?", """
SELECT MIN(partition_date) AS first_date_with_full_52w_baseline
FROM anomaly WHERE n_fix >= 52
""")

# ---------------------------------------------------------------- 2. comeback
con.execute("""
CREATE TABLE comeback AS
WITH base AS (
    SELECT store_id, partition_date, weekly_sales_amount
    FROM stg WHERE is_invalid_sales = FALSE
),
g AS (
    SELECT *, LAG(weekly_sales_amount) OVER (PARTITION BY store_id ORDER BY partition_date) AS prev_sales
    FROM base
),
w AS (
    SELECT *,
        SUM(weekly_sales_amount) OVER (PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING) AS next_4w,
        SUM(weekly_sales_amount) OVER (PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) AS past_4w,
        COUNT(*) OVER (PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING) AS fwd_n
    FROM g
)
SELECT store_id, partition_date AS comeback_start_date, next_4w, past_4w,
       next_4w - past_4w AS abs_growth,
       (next_4w - past_4w) / past_4w AS pct_growth
FROM w
WHERE weekly_sales_amount - prev_sales <= 0 AND fwd_n = 4
""")

show("2a. COMEBACK KING ranked by ABSOLUTE growth (as shipped)", """
SELECT store_id, comeback_start_date, ROUND(abs_growth) AS abs_growth,
       ROUND(pct_growth * 100, 1) AS pct_growth
FROM comeback ORDER BY abs_growth DESC LIMIT 5
""")

show("2b. COMEBACK KING ranked by RELATIVE growth (size-neutral)", """
SELECT store_id, comeback_start_date, ROUND(pct_growth * 100, 1) AS pct_growth,
       ROUND(abs_growth) AS abs_growth
FROM comeback ORDER BY pct_growth DESC LIMIT 5
""")

show("2c. Does absolute ranking just pick the biggest stores?", """
WITH sz AS (
    SELECT store_id, SUM(weekly_sales_amount) AS total,
           RANK() OVER (ORDER BY SUM(weekly_sales_amount) DESC) AS size_rank
    FROM stg WHERE is_invalid_sales = FALSE GROUP BY 1
),
top_abs AS (SELECT DISTINCT store_id FROM (SELECT store_id FROM comeback ORDER BY abs_growth DESC LIMIT 10)),
top_pct AS (SELECT DISTINCT store_id FROM (SELECT store_id FROM comeback ORDER BY pct_growth DESC LIMIT 10))
SELECT 'absolute' AS ranking, ROUND(AVG(sz.size_rank), 1) AS avg_store_size_rank
FROM top_abs t JOIN sz ON sz.store_id = t.store_id
UNION ALL
SELECT 'relative', ROUND(AVG(sz.size_rank), 1) FROM top_pct t JOIN sz ON sz.store_id = t.store_id
""")

show("2d. FAIL KINGS (worst 4-week deterioration)", """
SELECT store_id, comeback_start_date, ROUND(abs_growth) AS abs_growth,
       ROUND(pct_growth * 100, 1) AS pct_growth
FROM comeback ORDER BY abs_growth ASC LIMIT 5
""")

# ---------------------------------------------------------------- 3. fuel
con.execute("""
CREATE TABLE fuel AS
WITH base AS (
    SELECT store_id, partition_date, weekly_sales_amount, fuel_price
    FROM stg WHERE is_invalid_sales = FALSE
),
l AS (
    SELECT *,
        LAG(weekly_sales_amount) OVER (PARTITION BY store_id ORDER BY partition_date) AS prev_sales,
        LAG(fuel_price) OVER (PARTITION BY store_id ORDER BY partition_date) AS prev_fuel
    FROM base
)
SELECT store_id, partition_date, weekly_sales_amount, fuel_price,
    (weekly_sales_amount - prev_sales) / prev_sales AS sales_growth_pct,
    (fuel_price - prev_fuel) / prev_fuel AS fuel_growth_pct
FROM l WHERE prev_sales IS NOT NULL AND prev_fuel IS NOT NULL AND prev_fuel > 0
""")

show("3a. FUEL-SPIKE UNIVERSE (how much evidence exists at all?)", """
SELECT
    COUNT(*) AS store_weeks_total,
    SUM(CASE WHEN fuel_growth_pct > 0.05 THEN 1 ELSE 0 END) AS spike_gt_5pct,
    COUNT(DISTINCT CASE WHEN fuel_growth_pct > 0.05 THEN store_id END) AS stores_gt_5pct,
    COUNT(DISTINCT CASE WHEN fuel_growth_pct > 0.05 THEN partition_date END) AS weeks_gt_5pct,
    SUM(CASE WHEN fuel_growth_pct > 0.10 THEN 1 ELSE 0 END) AS spike_gt_10pct,
    COUNT(DISTINCT CASE WHEN fuel_growth_pct > 0.10 THEN store_id END) AS stores_gt_10pct,
    COUNT(DISTINCT CASE WHEN fuel_growth_pct > 0.10 THEN partition_date END) AS weeks_gt_10pct
FROM fuel
""")

show("3b. THE '+0.69% during fuel spikes' SCORECARD", """
SELECT ROUND(AVG(sales_growth_pct) * 100, 4) AS mean_sales_growth_pct,
       COUNT(*) AS n_store_weeks,
       ROUND(100.0 * SUM(CASE WHEN sales_growth_pct > 0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_resilient
FROM fuel WHERE fuel_growth_pct > 0.05
""")

show("3c. THE '10% COLLAPSE THRESHOLD' -- what is the actual sample?", """
SELECT partition_date, store_id, ROUND(fuel_growth_pct * 100, 1) AS fuel_growth,
       ROUND(sales_growth_pct * 100, 1) AS sales_growth
FROM fuel WHERE fuel_growth_pct > 0.10 ORDER BY fuel_growth_pct DESC
""")

show("3d. IRON WALL STORES: conditioned vs honest mean", """
WITH s AS (
    SELECT store_id,
        COUNT(*) AS spike_weeks,
        AVG(sales_growth_pct) AS mean_all,
        AVG(CASE WHEN sales_growth_pct > 0 THEN sales_growth_pct END) AS mean_positive_only,
        SUM(CASE WHEN sales_growth_pct > 0 THEN 1 ELSE 0 END) AS positive_weeks
    FROM fuel WHERE fuel_growth_pct > 0.05 GROUP BY 1
)
SELECT store_id, spike_weeks, positive_weeks,
       ROUND(mean_all * 100, 2) AS mean_growth_ALL_weeks,
       ROUND(mean_positive_only * 100, 2) AS mean_growth_POSITIVE_ONLY
FROM s WHERE spike_weeks >= 8 ORDER BY mean_all DESC
""")

# ---------------------------------------------------------------- 4. unemployment
con.execute("""
CREATE TABLE unemp AS
WITH base AS (
    SELECT store_id, partition_date, weekly_sales_amount, unemployment_rate
    FROM stg WHERE is_invalid_sales = FALSE
),
m AS (
    SELECT *,
        AVG(weekly_sales_amount) OVER (PARTITION BY store_id) AS baseline_alltime,
        AVG(weekly_sales_amount) OVER (PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING) AS baseline_trailing_52w,
        AVG(unemployment_rate) OVER (PARTITION BY store_id) AS avg_u,
        STDDEV_SAMP(unemployment_rate) OVER (PARTITION BY store_id) AS sd_u
    FROM base
)
SELECT *,
    unemployment_rate > (avg_u + sd_u) AS is_high_unemployment,
    weekly_sales_amount / baseline_alltime AS idx_alltime,
    weekly_sales_amount / baseline_trailing_52w AS idx_trailing
FROM m
""")

show("4a. RESILIENCE CHAMPIONS: all-time baseline (as shipped) vs trailing 52w", """
WITH s AS (
    SELECT store_id, COUNT(*) AS high_u_weeks,
        AVG(idx_alltime) AS idx_alltime,
        AVG(idx_trailing) AS idx_trailing
    FROM unemp WHERE is_high_unemployment GROUP BY 1 HAVING COUNT(*) >= 10
)
SELECT store_id, high_u_weeks,
       ROUND(idx_alltime * 100, 1) AS resilience_alltime_baseline,
       ROUND(idx_trailing * 100, 1) AS resilience_trailing_52w
FROM s ORDER BY idx_alltime DESC LIMIT 6
""")

show("4b. STORE 35 specifically", """
SELECT COUNT(*) AS high_u_weeks,
       ROUND(AVG(idx_alltime) * 100, 1) AS idx_alltime,
       ROUND(AVG(idx_trailing) * 100, 1) AS idx_trailing
FROM unemp WHERE is_high_unemployment AND store_id = 35
""")

# ---------------------------------------------------------------- 5. network
show("5a. NETWORK KPIs", """
SELECT COUNT(DISTINCT store_id) AS stores, COUNT(DISTINCT partition_date) AS weeks,
       ROUND(SUM(weekly_sales_amount) / 1e9, 2) AS total_sales_bn,
       ROUND(AVG(weekly_sales_amount)) AS avg_weekly_sales_per_store
FROM stg WHERE is_invalid_sales = FALSE
""")

show("5b. YEAR-ON-YEAR: is there '2.1% growth'? (like-for-like avg week)", """
SELECT EXTRACT(YEAR FROM partition_date) AS yr, COUNT(DISTINCT partition_date) AS weeks,
       ROUND(SUM(weekly_sales_amount) / 1e6, 1) AS total_mn,
       ROUND(AVG(weekly_sales_amount)) AS avg_per_store_week
FROM stg WHERE is_invalid_sales = FALSE GROUP BY 1 ORDER BY 1
""")

show("5c. LIKE-FOR-LIKE: same calendar window (Feb-Oct) each year", """
SELECT EXTRACT(YEAR FROM partition_date) AS yr, COUNT(DISTINCT partition_date) AS weeks,
       ROUND(SUM(weekly_sales_amount) / 1e6, 1) AS total_mn
FROM stg
WHERE is_invalid_sales = FALSE
  AND partition_date BETWEEN make_date(CAST(EXTRACT(YEAR FROM partition_date) AS INTEGER), 2, 1)
                         AND make_date(CAST(EXTRACT(YEAR FROM partition_date) AS INTEGER), 10, 22)
GROUP BY 1 ORDER BY 1
""")

show("5d. HOLIDAY-WEEK UPLIFT", """
SELECT is_holiday_week, COUNT(*) AS store_weeks,
       ROUND(AVG(weekly_sales_amount)) AS avg_sales
FROM stg WHERE is_invalid_sales = FALSE GROUP BY 1 ORDER BY 1
""")

show("5e. GAP CONTAMINATION: stores whose window frames span an excluded week", """
SELECT store_id, COUNT(*) AS excluded_weeks
FROM stg WHERE is_invalid_sales GROUP BY 1 ORDER BY 1
""")

print("\nDone. Every figure above is reproducible from raw/bia_data.csv.")
