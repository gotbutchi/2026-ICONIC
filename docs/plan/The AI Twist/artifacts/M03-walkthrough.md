# M03: Component Engineering Walkthrough

**Phase Objective:** Translate static CSV data into an interactive, highly aesthetic dashboard using Recharts and Tailwind CSS, adhering strictly to the "Editorial / Minimalist" concept.

## Technical Highlights
1. **Component Architecture:** Separated UI logic (`InsightCard.jsx`) from Data Viz logic (`charts/`) to prevent spaghetti code.
2. **Performance Optimization (Vite `?raw` Trick):** Caught and resolved a severe asynchronous fetching bug by explicitly importing CSV files as raw strings (`?raw`). Combined with `Papa.parse` and `useMemo`, this resulted in synchronous parsing and instantaneous render times without any React state flickering.
3. **Data Type Coercion:** Pre-emptively activated `dynamicTyping: true` in PapaParse to ensure numeric Z-scores and percentages did not break Recharts' Canvas engine.
4. **Layout Assembly:** Successfully mapped all 4 visual components side-by-side with their respective hardcoded Business Insights using a clean `grid-cols-1 lg:grid-cols-3` layout.
5. **Security & Presentation (Agentic Chatbot):** Deployed a mock Chatbot component (`<AgenticChatbot>`) at the client-side to simulate LLM Q&A without exposing actual API keys, showcasing both UX and System Architecture awareness for the final presentation.
