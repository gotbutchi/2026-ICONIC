import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import rawData from '../../data/comeback_king_mock_data.csv?raw';

const ComebackBlock = ({ selectedStoreId }) => {
  const [topN, setTopN] = useState(1);
  // Absolute VND is what the brief asks for, but it mostly ranks store size.
  // Switching to the relative measure changes the answer, so the dashboard lets
  // you see both rather than picking one silently.
  const [rankedBy, setRankedBy] = useState('absolute');

  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data
      .filter(row => row.store_id && row.label === 'Comeback King' && row.ranked_by === rankedBy)
      .sort((a, b) => (rankedBy === 'absolute'
        ? b.absolute_comeback_growth - a.absolute_comeback_growth
        : b.pct_comeback_growth - a.pct_comeback_growth))
      .slice(0, topN);
  }, [topN, rankedBy]);

  const formatMillions = (val) => {
    if (!val) return '0 ₫';
    return (val > 0 ? '+' : '') + (val / 1000000).toFixed(2) + 'M ₫';
  };
  const formatPct = (val) => (val === null || val === undefined ? '—' : (val > 0 ? '+' : '') + (val * 100).toFixed(1) + '%');

  return (
    <div className="w-full h-full overflow-x-auto bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <div className="mb-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-slate-900">Comeback Kings (Spring Rebound)</h3>
          <div className="flex gap-2">
            <select
              value={rankedBy}
              onChange={(e) => setRankedBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="absolute">Rank by VND</option>
              <option value="relative">Rank by % (size-neutral)</option>
            </select>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>Show Top 1</option>
              <option value={10}>Show Top 10</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Definition:</strong> the store with the highest cumulative sales growth in the 4 weeks
          immediately following a week of negative or zero growth, measured against the prior 4 weeks.
          Ranking by VND favours large stores (avg store-size rank 7 of 45); ranking by % is size-neutral
          (avg rank 27).
        </p>
      </div>

      <table className="w-full text-left text-sm text-slate-900">
        <thead className="border-b border-slate-200 uppercase text-slate-500 text-xs tracking-wider">
          <tr>
            <th className="py-2 px-2 font-medium">Store ID</th>
            <th className="py-2 px-2 font-medium">Event Date</th>
            <th className="py-2 px-2 font-medium text-right">Growth (VND)</th>
            <th className="py-2 px-2 font-medium text-right">Growth (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => {
            const isHighlight = selectedStoreId && selectedStoreId !== 'None' && row.store_id.toString() === selectedStoreId.toString();
            const rowClass = isHighlight ? 'bg-purple-50' : 'hover:bg-slate-50';
            return (
              <tr key={idx} className={`${rowClass} transition-colors`}>
                <td className="py-3 px-2 font-medium">
                  Store {row.store_id}
                  {isHighlight && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-purple-500"></span>}
                </td>
                <td className="py-3 px-2 text-slate-600">{new Date(row.comeback_start_date).toLocaleDateString()}</td>
                <td className={`py-3 px-2 text-right font-bold ${rankedBy === 'absolute' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {formatMillions(row.absolute_comeback_growth)}
                </td>
                <td className={`py-3 px-2 text-right font-bold ${rankedBy === 'relative' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {formatPct(row.pct_comeback_growth)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ComebackBlock;
