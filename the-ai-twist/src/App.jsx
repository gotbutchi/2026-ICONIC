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
              description="• Over 80% of top Flash Sale events (Z > +5) occurred during Black Friday week (Nov 26 - Nov 29).&#10;&#10;• Tier-2 stores (like Store 29) exhibited the highest promotional elasticity, nearly doubling their 52-week baselines.&#10;&#10;• Critical Alert: Store 36 suffered a massive -3.01σ drop on Nov 29, indicating a severe localized operational failure." 
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
              description="Store 14 is the ultimate Comeback King, achieving a network-high +4.37M ₫ recovery immediately following a negative growth week in early Feb 2019." 
            />
            <InsightCard 
              title="The Post-Holiday Hangover" 
              description="Paradoxically, Store 14 is also the worst Fail King, suffering a severe -3.88M ₫ drop in late Dec 2019. This proves its extreme seasonality and susceptibility to post-holiday slumps rather than operational failures." 
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
              title="The 10% Vulnerability Threshold" 
              description="• Iron Wall Stores: Store 33 & 42 defied inflation, growing sales by over +9% even when fuel spiked +6.5%.&#10;&#10;• Critical Threshold: When fuel price inflation exceeds +10%, network resilience collapses. All stores plunge into 'Pro-Cyclical' vulnerability, losing up to 20% volume." 
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
              title="The Lipstick Effect" 
              description="• Store 35 emerged as the Absolute Champion in downturns. Across 21 distinct weeks of high unemployment, it maintained a Resilience Index of 130% vs its normal baseline, successfully capturing down-trading consumers during economic hardship." 
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
