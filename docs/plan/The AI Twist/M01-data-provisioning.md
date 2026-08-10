# M01 — Data Provisioning (Python Automation Pipeline)

**Priority:** High · **Blocker for:** M03

## Context
To maintain the "Disconnected & Secure" methodology, the React app will not connect to a live backend. It will consume static `.csv` files acting as snapshot data. However, to ensure full reproducibility and eliminate manual BigQuery UI exports, we have engineered a Python extraction pipeline. 

## Scope
**In-Scope:** Setting up GCP credentials (`.env`), executing the `export_data.py` script to query dbt marts via BigQuery API, and auto-saving CSVs to the React `src/data/` structure.
**Out-of-Scope:** Hardcoding database credentials in the frontend app.

## Execution Steps (Python Automation)

To ensure evaluators can easily reproduce the exact datasets used in the dashboard without manually running queries in the BigQuery UI, we have provided an automated Python extraction script.

1. **Setup Environment:**
   - Navigate to the `scripts/` directory.
   - Install dependencies: `pip install -r requirements.txt`.
   - Copy `.env.example` to `.env` and configure your GCP Project ID, dbt dataset name, and path to your service account JSON key:
     ```bash
     GCP_PROJECT_ID=your-gcp-project-id
     DBT_DATASET=your-dbt-dataset-name
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
     ```

2. **Run Extraction Script:**
   - Execute the script: `python export_data.py`
   - The script will connect to BigQuery, execute the 4 analytical queries (with built-in bias prevention), and automatically export the results to `/the-ai-twist/src/data/`.

*(Note: The SQL queries executed by this script are designed to capture the "Full Statistical Reality". They use `UNION ALL` to fetch both Comeback and Fail Kings, and `ABS(z_score) > 3` to capture two-sided anomalies, preventing UI selection bias).*

### The Underlying SQL Logic (Anti-Bias Ensured)

> ⚠️ **The four queries below are the M01-era versions and are SUPERSEDED — see the
> [M05 addendum](#-extended-in-m05) at the foot of this document for what
> `export_data.py` actually runs today.** They are kept for the audit trail. Two things
> changed materially: the `LIMIT 1000` caps were removed (they silently truncated the
> event logs), and the unemployment and comeback queries now select both baselines and
> both rankings so the BI layer can expose the methodological choice instead of the
> extract deciding it. The pipeline now exports 10 files, not 4.

For transparency, these are the exact SQL queries executed by the Python script *at the
time of M01*:

#### 1. `unemployment_mock_data.csv`
*(Objective: Identify the most resilient stores during high unemployment periods)*
```sql
SELECT 
  store_id, partition_date, unemployment_rate, weekly_resilience_index, is_high_unemployment_period
FROM `your_project.your_dataset.mart_unemployment_sales_impact`
WHERE is_high_unemployment_period = TRUE
LIMIT 1000;
```

#### 2. `comeback_king_mock_data.csv`
*(Objective: Identify the top revenue recovery events vs Fail Kings)*
```sql
(SELECT store_id, comeback_start_date, absolute_comeback_growth, 'Comeback King' as label
 FROM `your_project.your_dataset.mart_comeback_king`
 ORDER BY absolute_comeback_growth DESC LIMIT 10)
UNION ALL
(SELECT store_id, comeback_start_date, absolute_comeback_growth, 'Fail King' as label
 FROM `your_project.your_dataset.mart_comeback_king`
 ORDER BY absolute_comeback_growth ASC LIMIT 10);
```

#### 3. `anomaly_detection_mock_data.csv`
*(Objective: Highlight extreme Flash Sale events and Critical Drops)*
```sql
SELECT 
  store_id, partition_date, weekly_sales_amount_vnd, rolling_52w_avg, z_score, anomaly_type
FROM `your_project.your_dataset.mart_anomaly_detection`
WHERE ABS(z_score) > 3
ORDER BY ABS(z_score) DESC
LIMIT 1000;
```

#### 4. `counter_cyclical_mock_data.csv`
*(Objective: Map fuel inflation against sales elasticity)*
```sql
SELECT 
  store_id, partition_date, sales_growth_pct, fuel_growth_pct, economic_trend_type
FROM `your_project.your_dataset.mart_counter_cyclical`
WHERE fuel_growth_pct > 0.05
-- Dont use Order By Fuel Growth to get the scattered 5%, 8%, 12%  
LIMIT 1000;
```

## Implementation Checklist
- [ ] Ensure terminal/git is checked out to `feature/the-ai-twist`.
- [ ] Configure `scripts/.env` with valid GCP credentials.
- [ ] Run `python scripts/export_data.py`.
- [ ] Verify `unemployment_mock_data.csv` is generated.
- [ ] Verify `comeback_king_mock_data.csv` is generated.
- [ ] Verify `anomaly_detection_mock_data.csv` is generated.
- [ ] Verify `counter_cyclical_mock_data.csv` is generated.

## Acceptance Criteria
- All four `.csv` files exist locally. Table data (Comeback) contains ~20 rows, while Scatter Plot data contains ~1000 rows (easily handled by client-side parsing).
- The CSV headers strictly match the column names defined in `schema.yml`.

---

## 🔄 Extended in [M05](M05-statistical-correction.md)

The pipeline now exports **10** extracts rather than 4. The four originals gained columns; the
six additions exist so the dashboard can qualify its own claims:

| Extract | Purpose |
| --- | --- |
| `unemployment_mock_data.csv` | **+** `resilience_index_alltime` and `resilience_index_trailing` — both baselines, so the chart can expose the choice |
| `comeback_king_mock_data.csv` | **+** `pct_comeback_growth` and `ranked_by` — 40 rows now (top/bottom 10 under *both* rankings) |
| `anomaly_detection_mock_data.csv` | **+** `requires_investigation`, `is_holiday_week`, `baseline_weeks`, `has_full_52w_baseline` |
| `counter_cyclical_mock_data.csv` | **+** `fuel_spike_bucket` — carries sample size into the BI layer |
| `spike_weeks.csv` | **NEW** — stores flagged per week; the breadth-vs-intensity view that corrected the Black Friday claim |
| `lfl_growth.csv` | **NEW** — like-for-like per store-week, identical Feb–Oct window each year |
| `overall_kpis.csv` | Now covers the **whole feed** (6.74bn ₫, 143 weeks) instead of a truncated "Oct 2021 month" that in fact ended on the 22nd |
| `top_10_stores.csv` | **+** `region_name` from the `store_region` seed |
| `weekly_trend.csv` | **+** `is_trading_peak_week`, correcting the source holiday flag |
| `data_quality_log.csv` | **NEW** — every row the models excluded, and why (`sales_quality_code`, `is_date_recovered`) |

**Extended acceptance criteria:**
- [x] No extract filters to a single favourable tail (the rule is now a comment at the top of `export_data.py`)
- [x] Any metric with a methodological choice ships **both** variants, so the UI can expose it
- [x] Every exported figure reproducible via `scripts/verify_insights.py` (DuckDB, independent of BigQuery)
