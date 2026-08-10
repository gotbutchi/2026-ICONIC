# M02 — Frontend Scaffolding

**Priority:** High · **Blocker for:** M03

## Context
We need a robust, modern frontend environment to host the AI-generated components. Vite provides instantaneous hot-module replacement (HMR), making it ideal for rapid prototyping ("Vibe Coding").

## Scope
**In-Scope:** React project initialization, Tailwind CSS configuration, installing dependencies (Recharts, PapaParse for CSV).
**Out-of-Scope:** Writing actual UI components (handled in M03).

## Execution Steps
1. **Initialize Vite React Project:**
   - Run `npx -y create-vite@latest the-ai-twist --template react` in the project root.
2. **Install Core Dependencies:**
   - Navigate to `/the-ai-twist` and run `npm install`.
   - Install visualization and parsing tools: `npm install recharts tailwindcss postcss autoprefixer papaparse lucide-react`.
3. **Configure Tailwind:**
   - Run `npx tailwindcss init -p`.
   - Update `tailwind.config.js` to scan `./src/**/*.{js,jsx,ts,tsx}`.
   - Inject Tailwind directives into `src/index.css`.
4. **Clean Boilerplate:**
   - Delete default Vite boilerplate CSS (`App.css`).
   - Scaffold the `src/components/` and `src/data/` directories.

## Implementation Checklist
- [ ] Initialize Vite (`the-ai-twist`).
- [ ] Install `recharts`, `tailwindcss`, and `papaparse`.
- [ ] Configure `tailwind.config.js` and `index.css`.
- [ ] Ensure `npm run dev` boots successfully with a blank screen.

## Acceptance Criteria
- A standalone React application exists in `/the-ai-twist`.
- Tailwind utility classes successfully apply to a test element (e.g., `<div className="bg-emerald-100 text-slate-900">Test</div>`).
