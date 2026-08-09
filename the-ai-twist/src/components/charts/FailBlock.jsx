import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import rawData from '../../data/comeback_king_mock_data.csv?raw';

const FailBlock = ({ selectedStoreId }) => {
  const [topN, setTopN] = useState(1);

  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data
      .filter(row => row.store_id && row.label === 'Fail King')
      .sort((a, b) => Math.abs(b.absolute_comeback_growth) - Math.abs(a.absolute_comeback_growth))
      .slice(0, topN);
  }, [topN]);

  const formatMillions = (val) => {
    if (!val) return '0 ₫';
    return (val > 0 ? '+' : '') + (val / 1000000).toFixed(2) + 'M ₫';
  };

  return (
    <div className="w-full h-full overflow-x-auto bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-bold text-slate-900">Fail Kings (Post-Holiday Hangover)</h3>
          <select 
            value={topN} 
            onChange={(e) => setTopN(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-rose-500"
          >
            <option value={1}>Show Top 1</option>
            <option value={10}>Show Top 10</option>
          </select>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Definition:</strong> Identify the store that suffered the most severe cumulative sales drop in the 4 weeks immediately following a week of peak growth.
        </p>
      </div>

      <table className="w-full text-left text-sm text-slate-900">
        <thead className="border-b border-slate-200 uppercase text-slate-500 text-xs tracking-wider">
          <tr>
            <th className="py-2 px-2 font-medium">Store ID</th>
            <th className="py-2 px-2 font-medium">Event Date</th>
            <th className="py-2 px-2 font-medium text-right">Drop (VND)</th>
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
                <td className="py-3 px-2 text-right font-bold text-rose-500">
                  {formatMillions(row.absolute_comeback_growth)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FailBlock;
