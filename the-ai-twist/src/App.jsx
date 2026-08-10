import React, { useState } from 'react';
import InsightCard from './components/ui/InsightCard';
import ComebackBlock from './components/charts/ComebackBlock';
import FailBlock from './components/charts/FailBlock';
import AnomalyScatter from './components/charts/AnomalyScatter';
import FuelElasticityMatrix from './components/charts/FuelElasticityMatrix';
import UnemploymentScatter from './components/charts/UnemploymentScatter';
import ExecutiveSummary from './components/ui/ExecutiveSummary';
import OverallPerformance from './components/charts/OverallPerformance';
import AgenticChatbot from './components/ui/AgenticChatbot';
import TourGuide from './components/ui/TourGuide';
import { Sparkles } from 'lucide-react';

function App() {
  const [selectedStoreId, setSelectedStoreId] = useState('None');
  const [runTour, setRunTour] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 relative">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight uppercase">The Iconic</h1>
            <button 
              data-tour="step-1"
              onClick={() => setRunTour(true)}
              className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            >
              <Sparkles size={16} />
              Guide Me
            </button>
          </div>
          <h2 className="text-xl text-slate-500 font-light">Executive Analytics Dashboard (The AI Twist)</h2>
        </div>
        
        {/* Global Filter */}
        <div className="flex flex-col" data-tour="step-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Highlight Store:</label>
          <select 
            value={selectedStoreId} 
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-white border border-slate-300 text-sm rounded px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="None">None</option>
            {[...Array(45)].map((_, i) => (
              <option key={i+1} value={i+1}>Store {i+1}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        
        {/* Executive Summary Tier */}
        <ExecutiveSummary />

        {/* Overall Performance Tier */}
        <OverallPerformance />

        {/* Section II: Advanced Insights */}
        <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-2 uppercase tracking-wide">
          II. Advanced Insights
        </h2>

        {/* Module 1: Anomaly Detection */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="step-4">
          <div className="lg:col-span-2">
            <AnomalyScatter selectedStoreId={selectedStoreId} />
          </div>
          <div className="lg:col-span-1">
            <InsightCard
              title="Flash Sale Concentration & Critical Drops"
              description="• 169 store-weeks breach +3σ. Black Friday week (2019-11-22) is the most intense — all 10 of the largest spikes, peaking at 12.9σ — while the pre-Christmas week is the most broad: 40 of 45 stores in 2019, repeating with 38 in 2020.&#10;&#10;• Tier-2 stores show the highest promotional elasticity: Store 29 hit 12.9σ, nearly doubling its own 52-week baseline (528K → 975K ₫).&#10;&#10;• Critical Alert: Store 16 at -3.6σ and Store 36 at -3.4σ. Excluding the week under test from its own baseline lifted detected drops from 2 to 10 — the original window was masking real operational failures."
            />
          </div>
        </section>

        {/* Module 2: Comeback vs Fail Kings */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="step-5">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ComebackBlock selectedStoreId={selectedStoreId} />
            <FailBlock selectedStoreId={selectedStoreId} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <InsightCard
              title="The Spring Rebound"
              description="Store 14 is the Comeback King on both measures — a network-high +4.37M ₫ (+100.9%) recovery after a negative-growth week in early Feb 2019, and still top-3 when ranked by percentage. That robustness matters: ranking by VND alone selects the biggest stores (avg size rank 7 of 45 vs 27 for the % ranking)."
            />
            <InsightCard
              title="The Post-Holiday Hangover"
              description="Store 14 is also the worst Fail King, dropping -3.89M ₫ (-36.0%) in late Dec 2019 — and the same collapse repeats on 2020-12-25. A pattern that recurs in consecutive years is seasonality to be planned for, not an operational failure to be investigated."
            />
          </div>
        </section>

        {/* Module 3: Fuel Elasticity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="step-6">
          <div className="lg:col-span-2">
            <FuelElasticityMatrix selectedStoreId={selectedStoreId} />
          </div>
          <div className="lg:col-span-1">
            <InsightCard
              title="Fuel Elasticity — and the Limits of the Evidence"
              description="• Across all 111 store-weeks where fuel rose >5%, the network still grew +0.69% and split 50/50 resilient vs vulnerable.&#10;&#10;• Most fuel-exposed yet net-positive: Store 38 (+2.18% across 9 spike weeks), Store 33 (+1.35% / 15 weeks), Store 42 (+0.56% / 14 weeks). Averaging only their favourable weeks would report +9%, which conditions on the outcome.&#10;&#10;• Above +10% fuel growth every observed store turned pro-cyclical — but n = 3 store-weeks in one week (2021-10-08). A hypothesis to monitor, not a threshold to fund."
            />
          </div>
        </section>

        {/* Module 4: Unemployment Resilience */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-tour="step-7">
          <div className="lg:col-span-2">
            <UnemploymentScatter selectedStoreId={selectedStoreId} />
          </div>
          <div className="lg:col-span-1">
            <InsightCard
              title="The Lipstick Effect — Baseline Choice Reverses It"
              description="• Store 35 scores 126% against its whole-period average across 21 high-unemployment weeks. Against a trailing 52-week baseline it scores 99.4% — the apparent down-trading advantage was a growth trend, not a downturn effect.&#10;&#10;• Genuine performers on the causal baseline: Store 7 (114.9%, 27 weeks) and Store 16 (107.7%, 48 weeks — the largest sample). Audit those product mixes.&#10;&#10;• Method note: an all-period baseline looks ahead and does not detrend. Both indices ship in the mart so the difference is auditable, not hidden."
            />
          </div>
        </section>

      </main>
      
      {/* Agentic Chatbot Mockup */}
      <AgenticChatbot />

      {/* Tour Guide */}
      <TourGuide runTour={runTour} setRunTour={setRunTour} />
    </div>
  );
}

export default App;
