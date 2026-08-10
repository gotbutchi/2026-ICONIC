import React from 'react';
import { Target, Zap } from 'lucide-react';

export default function ExecutiveSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6 shadow-sm mb-12">
      {/* Cột 1: Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Executive Summary</h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-disc list-inside">
          <li>
            <strong>Network Stability:</strong> The 45-store footprint demonstrates robust baseline stability, generating 184.3M ₫ in total sales. The network inherently resists moderate inflation, achieving a +0.69% net growth during standard fuel spikes.
          </li>
          <li>
            <strong>Promotional Elasticity:</strong> Mega-campaigns (e.g., Black Friday) are the sole drivers of positive multi-sigma statistical anomalies. Crucially, Tier-2 stores exhibit significantly higher relative elasticity than high-volume flagship locations.
          </li>
          <li>
            <strong>Macro-Economic Vulnerability:</strong> The network possesses a strict breaking point. When local fuel price inflation breaches the 10% threshold, systemic resilience collapses, flipping the majority of stores into a vulnerable 'Pro-Cyclical' state.
          </li>
        </ul>
      </div>

      {/* Cột 2: Actions */}
      <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-emerald-800 uppercase tracking-wide">Strategic Actions to Take</h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-decimal list-inside">
          <li>
            <strong>Re-allocate Campaign Inventory:</strong> Shift future Black Friday and clearance inventory buffers heavily toward elastic Tier-2 stores (e.g., Store 29) to maximize ROI, rather than defaulting to top-volume branches.
          </li>
          <li>
            <strong>Deploy Targeted Subsidies:</strong> Implement an automated early-warning system. Emergency pricing subsidies or localized promotions should only be triggered when regional fuel inflation exceeds the critical 10% threshold.
          </li>
          <li>
            <strong>Scale the 'Lipstick Effect':</strong> Audit the product mix and operational strategy of Store 35 (The Downturn Champion). Replicate its success in capturing down-trading consumers across other high-unemployment regions.
          </li>
        </ul>
      </div>
    </div>
  );
}
