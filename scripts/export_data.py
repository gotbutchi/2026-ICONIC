"""
Exports aggregated extracts from the BigQuery marts into the React app's
src/data directory.

Design rule: NEVER export only the favourable tail. Every extract that feeds a
scatter plot or a ranking keeps both extremes, so the dashboard shows the
baseline the outliers are outliers against. An earlier version of this script
used `ORDER BY ... LIMIT 30` and `WHERE anomaly_type = 'Positive Anomaly (Spike)'`,
which silently deleted the Critical Drops and Fail Kings from the story.
"""

import os

import pandas as pd
from dotenv import load_dotenv
from google.cloud import bigquery

# Load environment variables
load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
DATASET = os.getenv("DBT_DATASET")

if not PROJECT_ID or not DATASET:
    raise ValueError("Missing GCP_PROJECT_ID or DBT_DATASET in .env file")

# Initialize BigQuery client (implicitly uses GOOGLE_APPLICATION_CREDENTIALS)
client = bigquery.Client(project=PROJECT_ID)

# Define output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "the-ai-twist", "src", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

QUERIES = {
    # Both baselines, so the dashboard can show that the all-period baseline
    # overstates resilience and the trailing baseline is the causal one.
    "unemployment_mock_data.csv": f"""
        SELECT
          store_id, partition_date, unemployment_rate,
          resilience_index_alltime, resilience_index_trailing,
          is_high_unemployment_period
        FROM `{PROJECT_ID}.{DATASET}.mart_unemployment_sales_impact`
        WHERE is_high_unemployment_period = TRUE
    """,
    # Top and bottom of BOTH rankings: absolute (what the brief asks) and
    # percentage (size-neutral), so the size bias is visible rather than hidden.
    "comeback_king_mock_data.csv": f"""
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, pct_comeback_growth,
                'Comeback King' AS label, 'absolute' AS ranked_by
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY absolute_comeback_growth DESC LIMIT 10)
        UNION ALL
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, pct_comeback_growth,
                'Fail King' AS label, 'absolute' AS ranked_by
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY absolute_comeback_growth ASC LIMIT 10)
        UNION ALL
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, pct_comeback_growth,
                'Comeback King' AS label, 'relative' AS ranked_by
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY pct_comeback_growth DESC LIMIT 10)
        UNION ALL
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, pct_comeback_growth,
                'Fail King' AS label, 'relative' AS ranked_by
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY pct_comeback_growth ASC LIMIT 10)
    """,
    # ABS(z) > 3 keeps both tails. baseline_weeks and the holiday flag travel with
    # it so the chart can be honest about baseline maturity and expected events.
    "anomaly_detection_mock_data.csv": f"""
        SELECT
          store_id, partition_date, weekly_sales_amount_vnd, rolling_52w_avg,
          z_score, anomaly_type, requires_investigation,
          is_holiday_week, baseline_weeks, has_full_52w_baseline
        FROM `{PROJECT_ID}.{DATASET}.mart_anomaly_detection`
        WHERE ABS(z_score) > 3
        ORDER BY z_score DESC
    """,
    # How many stores hit >3 sigma in each week: the "which week actually
    # dominates" view. Black Friday is the most intense, pre-Christmas the broadest.
    "spike_weeks.csv": f"""
        SELECT
          partition_date,
          COUNT(*) AS stores_flagged,
          ROUND(AVG(z_score), 2) AS avg_z_score,
          ROUND(MAX(z_score), 2) AS max_z_score,
          MAX(CAST(is_holiday_week AS INT64)) AS source_flagged_holiday
        FROM `{PROJECT_ID}.{DATASET}.mart_anomaly_detection`
        WHERE anomaly_type = 'Positive Anomaly (Spike)'
        GROUP BY partition_date
        ORDER BY stores_flagged DESC
    """,
    # All fuel-spike weeks, both labels, with the sample-size bucket attached.
    "counter_cyclical_mock_data.csv": f"""
        SELECT
          store_id, partition_date, sales_growth_pct, fuel_growth_pct,
          economic_trend_type, fuel_spike_bucket
        FROM `{PROJECT_ID}.{DATASET}.mart_counter_cyclical`
        WHERE fuel_growth_pct > 0.05
    """,
    # Whole-feed KPIs. The previous version filtered to Oct-2021 and labelled the
    # result a month, but the feed stops on the 22nd -- a truncated period.
    "overall_kpis.csv": f"""
        SELECT
          SUM(weekly_sales_amount_vnd) AS total_sales,
          COUNT(DISTINCT store_id) AS unique_stores,
          COUNT(DISTINCT partition_date) AS total_weeks,
          AVG(weekly_sales_amount_vnd) AS avg_weekly_sales_per_store,
          MIN(partition_date) AS first_week,
          MAX(partition_date) AS last_week
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = FALSE
    """,
    # Like-for-like growth: identical calendar window (Feb 1 - Oct 22) each year,
    # compared per store-week so unequal week counts cannot distort it.
    "lfl_growth.csv": f"""
        SELECT
          EXTRACT(YEAR FROM partition_date) AS year_num,
          COUNT(DISTINCT partition_date) AS weeks_in_window,
          SUM(weekly_sales_amount_vnd) AS total_sales,
          AVG(weekly_sales_amount_vnd) AS avg_sales_per_store_week
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = FALSE
          AND CAST(FORMAT_DATE('%m%d', partition_date) AS INT64) BETWEEN 201 AND 1022
        GROUP BY year_num
        ORDER BY year_num
    """,
    "weekly_trend.csv": f"""
        SELECT
          f.partition_date,
          SUM(f.weekly_sales_amount_vnd) AS total_weekly_sales,
          MAX(CAST(f.is_holiday_week AS INT64)) AS source_flagged_holiday,
          MAX(CAST(d.is_trading_peak_week AS INT64)) AS is_trading_peak_week
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales` f
        JOIN `{PROJECT_ID}.{DATASET}.dim_date` d ON f.partition_date = d.date_id
        WHERE f.is_invalid_sales = FALSE
        GROUP BY f.partition_date
        ORDER BY f.partition_date ASC
    """,
    "top_10_stores.csv": f"""
        SELECT
          f.store_id,
          ANY_VALUE(s.region_name) AS region_name,
          SUM(f.weekly_sales_amount_vnd) AS total_sales
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales` f
        JOIN `{PROJECT_ID}.{DATASET}.dim_store` s ON f.store_sk = s.store_sk
        WHERE f.is_invalid_sales = FALSE
        GROUP BY f.store_id
        ORDER BY total_sales DESC
        LIMIT 10
    """,
    # The data-quality audit, straight from the pipeline rather than asserted in a
    # slide: every row the models excluded, and why.
    "data_quality_log.csv": f"""
        SELECT
          store_id, partition_date, sales_quality_code, is_date_recovered,
          weekly_sales_amount_vnd
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = TRUE OR is_date_recovered = TRUE
        ORDER BY partition_date
    """,
}


def export_to_csv():
    for filename, query in QUERIES.items():
        print(f"Exporting {filename}...")
        try:
            df = client.query(query).to_dataframe()
            output_path = os.path.join(OUTPUT_DIR, filename)
            df.to_csv(output_path, index=False)
            print(f"Successfully saved {len(df)} rows to {output_path}")
        except Exception as e:
            print(f"Error exporting {filename}: {e}")


if __name__ == "__main__":
    export_to_csv()
