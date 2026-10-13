import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { 
  AlertTriangle, ShieldAlert, Clock, RefreshCw, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';

export const ExpiryView: React.FC = () => {
  const { batches, medicines, triggerExpiryCheck, addToast } = usePharmacy();
  const [selectedRange, setSelectedRange] = useState<number>(30); // Default to <= 30 days

  const now = new Date();
  const getDiffDays = (expStr: string) => {
    const exp = new Date(expStr);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  const filteredBatches = batches.filter(b => {
    const days = getDiffDays(b.expiryDate);
    if (selectedRange === -1) return days < 0; // Expired
    if (selectedRange === 7) return days >= 0 && days <= 7;
    if (selectedRange === 15) return days >= 0 && days <= 15;
    if (selectedRange === 30) return days >= 0 && days <= 30;
    if (selectedRange === 60) return days >= 0 && days <= 60;
    if (selectedRange === 90) return days >= 0 && days <= 90;
    if (selectedRange === 180) return days >= 0 && days <= 180;
    return true;
  });

  const handleRunExpiryEngine = async () => {
    addToast('Executing Dhanvantari Expiry & Quarantine Audit Engine...', 'info');
    await triggerExpiryCheck();
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Expiry Risk Engine & Auto-Quarantine Management</h3>
            <p className="text-xs text-slate-500">Automated tracking to prevent expired medicine sales and issue supplier debit notes.</p>
          </div>
        </div>

        <button
          onClick={handleRunExpiryEngine}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Run Auto Quarantine Check Now</span>
        </button>
      </div>

      {/* Countdown Bucket Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        
        {[
          { label: 'Expired (0d)', days: -1, bg: 'bg-rose-600 text-white' },
          { label: '1 to 7 Days', days: 7, bg: 'bg-rose-500 text-white' },
          { label: '8 to 15 Days', days: 15, bg: 'bg-amber-600 text-white' },
          { label: '16 to 30 Days', days: 30, bg: 'bg-amber-500 text-white' },
          { label: '31 to 60 Days', days: 60, bg: 'bg-blue-600 text-white' },
          { label: '61 to 90 Days', days: 90, bg: 'bg-slate-700 text-white' },
          { label: '91 to 180 Days', days: 180, bg: 'bg-slate-800 text-white' },
        ].map(b => (
          <button
            key={b.days}
            onClick={() => setSelectedRange(b.days)}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              selectedRange === b.days 
                ? `${b.bg} shadow-md ring-2 ring-amber-400` 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block opacity-80">{b.label}</span>
            <span className="text-base font-black font-mono">
              {batches.filter(bt => {
                const d = getDiffDays(bt.expiryDate);
                if (b.days === -1) return d < 0;
                return d >= 0 && d <= b.days;
              }).length}
            </span>
          </button>
        ))}

      </div>

      {/* Batches Risk Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Expiries Ledger Filtered ({filteredBatches.length} Batches)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Batch Number</th>
                <th className="py-2.5 px-3">Medicine Name</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-center">Days Left</th>
                <th className="py-2.5 px-3 text-center">Current Qty</th>
                <th className="py-2.5 px-3 text-right">Cost Price</th>
                <th className="py-2.5 px-3 text-right">Total Loss Value</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No batches match the selected expiry filter. Excellent stock health!
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => {
                  const med = medicines.find(m => m.id === batch.medicineId);
                  const daysLeft = getDiffDays(batch.expiryDate);
                  const isExpired = daysLeft < 0;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{batch.batchNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {med?.name || 'Medicine Entry'}
                        <span className="block text-[10px] text-slate-400 font-normal">{med?.genericName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{batch.expiryDate}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black">
                        {isExpired ? (
                          <span className="text-rose-600 font-bold">Expired ({Math.abs(daysLeft)}d ago)</span>
                        ) : (
                          <span className={daysLeft <= 15 ? 'text-amber-600' : 'text-emerald-600'}>{daysLeft} days</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{batch.currentQuantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{batch.purchasePrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        ₹{(batch.purchasePrice * batch.currentQuantity).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{batch.supplierName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          batch.status === 'Quarantined' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
