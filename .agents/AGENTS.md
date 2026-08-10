# THE ICONIC - Agentic Architecture Rules (`.agents/AGENTS.md`)

This file defines the **Global Behavioral Constraints and Autonomous Learning Loop** for all AI Agents operating in this repository.

## 1. The Autonomous Learning Loop (Best Practice)
Agents in this repository do NOT just generate code; they must continuously learn and persist knowledge. Follow this exact workflow:
1. **Consult Skills:** Before executing any task, check `.agents/skills/` for relevant `SKILL.md` files (e.g., `dbt-analytics-engineering`).
2. **Execute with Confidence:** Apply the rules defined in the skills strictly.
3. **Human-in-the-Loop (Fail-Safe):** If you encounter an edge case, ambiguity, or a bug not covered in the existing skills, **PAUSE AND ASK THE USER**. Do not guess.
4. **Knowledge Persistence (`/learn`):** After the user provides the solution or makes a design decision, you MUST proactively suggest updating this `AGENTS.md` file or the relevant `SKILL.md` so you never make the same mistake twice. This is mandatory for maintaining a robust AI memory.

## 2. Skill Integration
Complex tasks are abstracted into dedicated skills located in the `.agents/skills` directory:
- **dbt Analytics Engineering:** `.agents/skills/dbt-analytics-engineering/SKILL.md`
- **Business QA Agent:** `.agents/skills/business-qa-agent/SKILL.md`

*(When tasks fall outside these scopes, propose creating a new skill directory to the user).*

## 3. Global Project Rules (Dos and Don'ts)

**DO (Best Practices):**
- **Schema-First:** Always write/update `schema.yml` and define tests before writing SQL.
- **Event-Log Architecture:** Retain granularity (`partition_date`) for BI tool interactive filtering. Avoid premature `GROUP BY` aggregations in data marts.
- **SCD Type 2:** Use `LEAD()` window functions for time-bound dimensional models.
- **Graceful Error Handling:** Flag invalid data (e.g., `is_invalid_sales`) rather than dropping rows, to maintain data lineage completeness.
- **Privacy-First (Zero-PII):** Always operate on synthetic data or aggregated feature vectors within simulation scopes. Never attempt to log or expose raw PII.
- **Cross-Validation:** Ensure frontend UI components (React/Looker Studio) strictly match underlying dbt mart numbers to eliminate LLM mathematical hallucinations.
- **Repository Hygiene:** Respect `.gitignore` boundaries. Ensure temporary build artifacts (`.npm-cache`, `node_modules`, `.env`) are never committed to tracking.

**DON'T (Anti-Patterns):**
- **Do NOT Pre-Aggregate:** Never roll up data in dbt if it breaks the BI Date Range Filter.
- **Do NOT Hardcode Positive Bias:** Avoid strict `WHERE > 0` filters when searching for anomalies, as this creates blind spots for severe drops (Fail Kings).
- **Do NOT Use Absolute Metrics for Ranks:** When comparing stores of vastly different sizes, always use a relative metric (like `Z-Score` or `% vs Baseline`) rather than absolute revenue differences.
- **Do NOT Query Live Production PII:** Never attempt to pull direct transactional PII into public or client-side sandbox environments.
