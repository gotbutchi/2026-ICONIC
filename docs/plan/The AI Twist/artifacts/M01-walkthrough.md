# M01: Data Provisioning Walkthrough

**Phase Objective:** Extract snapshot data securely without exposing database credentials to the frontend app, ensuring anti-bias data modeling.

## Technical Highlights
1. **Anti-Bias Intervention:** Caught the LLM attempting to use naive `LIMIT` and `ORDER BY DESC`, which would have hidden crucial negative business events. Rewrote SQL using `UNION ALL` to guarantee full statistical reality.
2. **Python Automation:** Instead of manual UI exports, engineered a Python script utilizing `google-cloud-bigquery` and `pandas` to automate the extraction pipeline.
3. **Security:** By utilizing static CSVs, we maintained the "Disconnected & Secure" architectural constraint.
