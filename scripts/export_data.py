import os
import pandas as pd
from google.cloud import bigquery
from dotenv import load_dotenv

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
    "unemployment_mock_data.csv": f"""
        SELECT 
          store_id, partition_date, unemployment_rate, weekly_resilience_index, is_high_unemployment_period
        FROM `{PROJECT_ID}.{DATASET}.mart_unemployment_sales_impact`
        WHERE is_high_unemployment_period = TRUE
        LIMIT 1000
    """,
    "comeback_king_mock_data.csv": f"""
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, 'Comeback King' as label
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY absolute_comeback_growth DESC LIMIT 10)
        UNION ALL
        (SELECT store_id, comeback_start_date, absolute_comeback_growth, 'Fail King' as label
         FROM `{PROJECT_ID}.{DATASET}.mart_comeback_king`
         ORDER BY absolute_comeback_growth ASC LIMIT 10)
    """,
    "anomaly_detection_mock_data.csv": f"""
        SELECT 
          store_id, partition_date, weekly_sales_amount_vnd, rolling_52w_avg, z_score, anomaly_type
        FROM `{PROJECT_ID}.{DATASET}.mart_anomaly_detection`
        WHERE ABS(z_score) > 3
        ORDER BY ABS(z_score) DESC
        LIMIT 1000
    """,
    "counter_cyclical_mock_data.csv": f"""
        SELECT 
          store_id, partition_date, sales_growth_pct, fuel_growth_pct, economic_trend_type
        FROM `{PROJECT_ID}.{DATASET}.mart_counter_cyclical`
        WHERE fuel_growth_pct > 0.05
        LIMIT 1000
    """,
    "overall_kpis.csv": f"""
        SELECT 
          SUM(weekly_sales_amount_vnd) as total_sales,
          COUNT(DISTINCT store_id) as unique_stores,
          AVG(weekly_sales_amount_vnd) as avg_weekly_sales_per_store
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = FALSE
          AND partition_date >= '2021-10-01' 
          AND partition_date <= '2021-10-31'
    """,
    "weekly_trend.csv": f"""
        SELECT 
          partition_date,
          SUM(weekly_sales_amount_vnd) as total_weekly_sales
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = FALSE
        GROUP BY partition_date
        ORDER BY partition_date ASC
    """,
    "top_10_stores.csv": f"""
        SELECT 
          store_id,
          SUM(weekly_sales_amount_vnd) as total_sales
        FROM `{PROJECT_ID}.{DATASET}.fct_weekly_sales`
        WHERE is_invalid_sales = FALSE
        GROUP BY store_id
        ORDER BY total_sales DESC
        LIMIT 10
    """
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
