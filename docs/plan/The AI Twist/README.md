# The AI Twist: Modular Implementation Plan

This directory contains the step-by-step modular plan for building "The AI Twist" (React Web Dashboard). 
Each `M##-*.md` file represents a self-contained work module that can be executed independently.

## ⚠️ Core Architectural Constraints

Before starting any module, adhere to the following strict rules:

### 1. Branch Isolation
- **Rule:** Do NOT commit React code to the `main` branch directly.
- **Action:** All development for this web app MUST occur exclusively on the `feature/the-ai-twist` branch. Code will only be merged after full UI verification.

### 2. The "Disconnected" Data Strategy
- **Rule:** Do NOT set up an automated backend or direct API connections to BigQuery.
- **Action:** Rely purely on the "Schema-Driven, Disconnected" prompting method. You must manually query the dbt marts via BigQuery UI, export the results as static **CSV files**, and place them in the `src/data/` folder of the React app.

### 3. Design Language
- **Rule:** Avoid standard SaaS themes (no Dark Mode, no glassmorphism).
- **Action:** Implement the "High-Contrast Editorial / Minimalist E-Commerce" design system (Stark white backgrounds, sharp black text, thin borders). Use Emerald Green for positive metrics and Coral Red for negative metrics.

### 4. Data Critical Thinking (Bias Prevention)
- **Rule:** Do NOT blindly aggregate or filter data (e.g., naive `LIMIT` or `ORDER BY DESC`) if it destroys the baseline or hides negative outliers.
- **Action:** Always ensure the data extracts reflect the "Full Statistical Reality". Use techniques like `UNION ALL` to capture both extremes (e.g., Comebacks vs. Fail Kings) and `ABS(z_score)` to capture two-sided anomalies, preventing selection bias in the frontend charts.

### 5. Evidence Integrity (No Unsourced Numbers) — added in M05
- **Rule:** Do NOT display a figure that cannot be reproduced from `raw/bia_data.csv`. Do NOT quote a threshold, average or ranking without its sample size.
- **Action:** Verify every published number via `scripts/verify_insights.py`, which rebuilds the whole pipeline in DuckDB independently of BigQuery. Where a metric depends on a methodological choice (which baseline? absolute or relative?), **ship both and expose the choice as a UI control** rather than silently selecting the favourable one.
- **Why this exists:** constraint 4 stopped the *extraction* from hiding outliers. It did not stop the *interpretation* from conditioning on the outcome — which is exactly what happened to four of five published insights. See [M05](M05-statistical-correction.md).

## 📝 Workflow & Artifact Documentation
- **Rule:** The execution workflow is strictly modular. Progressing to the next module is forbidden until the current module is fully validated.
- **Action:** Upon completion of each module (M00 -> M04), an explicit `[Module]-walkthrough.md` artifact MUST be generated in the `/docs/plan/The AI Twist/artifacts/` directory. This document must summarize:
  1. **Execution Summary:** The exact steps taken.
  2. **Human-in-the-Loop Interventions:** Any technical hurdles, data biases, or architectural decisions that required human sign-off/correction.
  3. **Validated Outcomes:** The final results achieved against the Acceptance Criteria.

---

## 📦 Modules Overview

| Module | Description | Status |
|--------|-------------|--------|
| **[M00 - Insight Mapping](M00-insight-mapping.md)** | Blueprint mapping SQL results to UI components | ✅ Completed |
| **[M01 - Data Provisioning](M01-data-provisioning.md)** | Python Automation Pipeline for BigQuery exports | ✅ Completed |
| **[M02 - Frontend Scaffolding](M02-frontend-scaffolding.md)** | React/Vite initialization & Tailwind setup | ✅ Completed |
| **[M03 - Component Engineering](M03-component-engineering.md)** | UI/UX implementation using Recharts | ✅ Completed |
| **[M035 - Improvement Plan & UI Polish](M035-improvement-plan.md)** | Fixing Data Bias, Scorecards, Top N Filters, Global Highlights | ✅ Completed |
| **[M036 - UX & Onboarding Layer](artifacts/M036-walkthrough.md)** | Product Tour (`react-joyride`), Chart Legends, Definitions | ✅ Completed |
| **[M04 - Deployment & Presentation](M04-deployment-presentation.md)** | Vercel deploy & README documentation | ✅ Completed |
| **[M05 - Statistical Correction & Evidence Integrity](M05-statistical-correction.md)** | Re-verified every figure against raw source; fixed the anomaly baseline window (drops detected 2 → 10), corrected 4 over-stated insights, added baseline/ranking toggles, disclosed prototype scope. Tests 22 → 74. | ✅ Completed |
