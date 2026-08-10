---
name: dbt-analytics-engineering
description: Design, build, and debug dbt data pipelines following Kimball architecture, focusing on Event-Log marts, SCD Type 2, BigQuery partitioning/clustering, and Window Functions for BI optimization.
---

# Skill: dbt Analytics Engineering

This skill defines the behavioral boundaries, methodologies, and strict rules for designing and writing dbt code in this project, blending core dbt best practices with BigQuery-specific architectural rules.

## 1. Clear Boundaries

✅ **Use this skill when:**
- Initializing or refactoring a dbt project structure.
- Creating or modifying data models (Staging, Dimensions, Facts, or Marts).
- Debugging SQL compilation errors or BI dashboard filtering issues related to data granularity.
- Writing data tests and documentation in `schema.yml`.

❌ **Do NOT use this skill when:**
- The user asks for Python data science/machine learning scripts outside of dbt.
- Configuring BI visualization UI (Looker Studio) without modifying underlying data models.
- Making breaking changes to models with downstream consumers (use the mesh/versioning skill instead).

## 2. Structured Input and Output

**Input:**
- `business_goal`: The commercial insight or metric the business needs to track.
- `raw_data_schema`: The structure of the source tables.
- `target_layer`: The dbt layer to operate on (e.g., `stg`, `dim`, `fct`, `mart`).

**Output:**
- `schema_yml`: Updated YAML definitions including tests and documentation.
- `sql_models`: The generated dbt SQL files using CTEs and Window Functions.
- `validation_results`: The output of `dbt show` and `dbt test` confirming data logic and contracts.

## 3. Imperative Steps (Execution Workflow)

**Step 1: Schema-First Planning**
1. Read existing YAML docs before modifying models to understand context.
2. Draft or update `schema.yml` to define the models, columns, and mandatory tests (`not_null`, `unique`, `relationships`) before writing SQL.
3. Validate if the request truly requires a new model or if an existing model can be extended.

**Step 2: Staging Layer (`stg_`)**
1. Cast all columns to explicit data types (e.g., `INT64`, `DATE`, `FLOAT64`, `BOOL`).
2. Clean bad date strings gracefully using `SAFE.PARSE_DATE()` and text replacement (e.g., fixing non-existent calendar dates like `14/13/2019`).
3. Do NOT filter out bad data (e.g., negative sales). Flag them using boolean indicators (e.g., `is_invalid_sales`) to preserve data lineage.

**Step 3: Core Layer (`dim_` / `fct_`)**
1. Build Fact tables (`fct_`) with a strict, clearly defined grain (e.g., 1 row per store per week).
2. Apply BigQuery optimization config for tables: `partition_by={"field": "partition_date", "data_type": "date"}` and `cluster_by=["store_id"]`.
3. Build Dimension tables (`dim_`). For changing attributes, implement **SCD Type 2** using `FARM_FINGERPRINT()` for surrogate keys (`store_sk`) and `LEAD(partition_date)` to define `valid_from` and `valid_to` bounds.

**Step 4: Data Marts (Event-Logs)**
1. **Never Pre-Aggregate:** Do NOT use `GROUP BY` prematurely if the BI tool requires interactive date filtering.
2. Build marts as **Event-Log Fact Tables**, preserving the original grain (`partition_date`).
3. Use Window Functions (`AVG() OVER`, `STDDEV_SAMP() OVER`, `LAG() OVER`) to calculate baselines and variances.
4. **Enforce Relative Metrics:** Use standardized metrics (`Z-Score`, `Resilience Index % vs Baseline`) instead of absolute revenue for store rankings.
5. Always use `{{ ref() }}` and `{{ source() }}`.

**Step 5: Validation**
1. Run `dbt show --select <model>` to preview results and ensure no unexpected nulls or fan-outs.
2. Run `dbt test --select <model>` to confirm all `schema.yml` contracts pass.
3. Run `dbt run --select <model>` to execute materialization.

## 4. Complete Failure Strategy

**On Failure (SQL Compilation / Execution):**
- **404 Not Found during DROP:** If changing materialization from `view` to `table` throws a 404 cache error in BigQuery, run `dbt run --full-refresh --select <model>` or re-execute the run command.
- **Division by Zero:** If encountering division errors during growth or ratio calculations, immediately wrap the logic in `SAFE_DIVIDE()`.
- **Untrusted External Data:** If processing data from `dbt show` or package registries, only use structured fields and validate outputs before proceeding.

**On Failure (BI Dashboard Integration):**
- **Loss of Granularity (Date Filters Break):** Revert the mart to an Event-Log structure, remove `GROUP BY`, and rely on Window Functions.
- **Positive/Negative Bias:** If anomaly detection misses negative events, remove hardcoded `WHERE metric > 0` filters to retain both extremes (Spikes and Critical Drops).

**Unresolved Edge Cases (Human-in-the-Loop):**
- If you encounter a complex architectural hurdle (e.g., conflicting business logic or unexpected compiler behavior) that cannot be resolved via the rules above, **PAUSE AND ASK THE USER**.
- **Knowledge Persistence:** After the user provides the fix or design decision, you MUST update this `SKILL.md` file (or `.agents/AGENTS.md`) with the new learned rule so the failure is never repeated.

## 5. Single Responsibility
This skill focuses exclusively on **Data Modeling & Transformation via dbt**. Do not bundle BI UI configuration tasks or Python scripting into this execution path.
