import React, { useMemo } from 'react';
import Papa from 'papaparse';
import rawData from '../../data/data_quality_log.csv?raw';

/*
  Every row the pipeline excluded or repaired, published rather than hidden. A dashboard
  that shows what it left out is more trustworthy than one that silently drops rows, and
  it makes the Stage 1 audit demonstrable instead of merely asserted.
*/

const CODE_STYLE = {
  MISSING: 'bg-amber-100 text-amber-800',
  NEGATIVE: 'bg-rose-100 text-rose-800',
  ZERO: 'bg-slate-200 text-slate-700',
  VALID: 'bg-emerald-100 text-emerald-800',
};

const NOTES = {
  MISSING: 'Null sales in the source. Defaulted to 0 and excluded from analytics; the row itself is retained so lineage stays complete.',
  NEGATIVE: 'A returns or correction entry. Left in place it would corrupt every SUM and silently poison any window frame spanning it.',
  ZERO: 'Zero sales — excluded from analytics but retained for lineage.',
  VALID: 'Date was unparseable in the source and has been reconstructed. Sales figure itself is valid.',
};

const DataQualityLog = () => {
  const rows = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data.filter(r => r.store_id);
  }, []);

  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm p-4">
      <h3 className="text-lg font-bold text-slate-900 mb-1 px-2">Data Quality Log — Full Disclosure</h3>
      <p className="text-xs text-slate-500 mb-4 px-2 leading-relaxed">
        The source contained 6,435 rows across 45 stores and 143 weeks. Three needed intervention.
        Every one is listed here: nothing was silently dropped, and the reason code travels with the
        row all the way into the BI layer.
      </p>

      <table className="w-full text-left text-sm text-slate-900">
        <thead className="border-b border-slate-200 uppercase text-slate-500 text-xs tracking-wider">
          <tr>
            <th className="py-2 px-2 font-medium">Store</th>
            <th className="py-2 px-2 font-medium">Week</th>
            <th className="py-2 px-2 font-medium">Issue</th>
            <th className="py-2 px-2 font-medium">Handling</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, idx) => {
            const code = r.is_date_recovered === true || r.is_date_recovered === 'True'
              ? 'DATE RECOVERED'
              : r.sales_quality_code;
            const style = r.is_date_recovered === true || r.is_date_recovered === 'True'
              ? 'bg-violet-100 text-violet-800'
              : CODE_STYLE[r.sales_quality_code] || 'bg-slate-100 text-slate-700';
            const note = r.is_date_recovered === true || r.is_date_recovered === 'True'
              ? NOTES.VALID
              : NOTES[r.sales_quality_code];
            return (
              <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                <td className="py-3 px-2 font-medium whitespace-nowrap">Store {r.store_id}</td>
                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                  {new Date(r.partition_date).toLocaleDateString('en-AU')}
                </td>
                <td className="py-3 px-2 whitespace-nowrap">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${style}`}>{code}</span>
                </td>
                <td className="py-3 px-2 text-slate-600 text-xs leading-relaxed">{note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-xs text-slate-500 mt-4 px-2 leading-relaxed border-t border-slate-100 pt-3">
        <strong>The one worth reading twice:</strong> store 42's date read <code>14/13/2019</code> — month 13
        does not exist. A string replacement to December yields a Saturday, the only off-cadence week in the
        feed, which would shift that store's rolling windows by one position. The true week is
        <strong> 2019-06-14</strong>, confirmed three ways: it is the single gap in store 42's 143-week
        sequence, its unemployment value occurs only in that store's March–June window, and its CPI
        interpolates exactly between the adjacent weeks. A Friday-cadence dbt test now fails the build if it
        ever recurs.
      </p>
    </div>
  );
};

export default DataQualityLog;
