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
            <strong>Promotional Elasticity:</strong> Mega-campaigns (e.g., Black Friday) drive 80% of multi-sigma sales spikes. Crucially, medium-volume Tier-2 stores exhibit significantly higher relative promotional elasticity than high-volume flagship branches.
          </li>
          <li>
            <strong>Macro-Economic Vulnerability:</strong> Systemic resilience possesses a strict breaking point. When regional fuel inflation breaches the <strong>10% threshold</strong>, retail resilience collapses, plunging all branches into a vulnerable 'Pro-Cyclical' deficit (-5% to -20%).
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
            <strong>Re-allocate Campaign Inventory:</strong> Shift future Black Friday and clearance inventory buffers heavily toward high-elasticity Tier-2 branches (e.g., Store 29) to maximize promotional ROI, rather than over-indexing on flagship locations.
          </li>
          <li>
            <strong>Deploy Automated Fuel Subsidies:</strong> Implement an early-warning trigger in the supply chain. Localized pricing subsidies or promotional shields should <em>only</em> activate when regional fuel inflation breaches the critical <strong>10% threshold</strong>.
          </li>
          <li>
            <strong>Scale the 'Lipstick Effect':</strong> Audit the product mix and visual merchandising of Store 35 (The Downturn Champion, 130% Resilience Index). Replicate its value-line strategy across other high-unemployment regions to capture down-trading consumers.
          </li>
        </ul>
      </div>
    </div>
  );
}
