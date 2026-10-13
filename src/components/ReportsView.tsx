import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { 
  BarChart3, Download, Printer, FileText, TrendingUp, 
  DollarSign, PieChart, ShieldAlert, CheckCircle2, ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, purchases, medicines, batches, addToast } = usePharmacy();
  const [reportType, setReportType] = useState<'sales' | 'gst' | 'stock' | 'expiry' | 'fastslow'>('sales');

  const totalSalesVal = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalGstCollected = sales.reduce((acc, s) => acc + s.totalGst, 0);
  const totalStockValMRP = batches.reduce((acc, b) => acc + (b.mrp * b.currentQuantity), 0);
  const totalStockValCost = batches.reduce((acc, b) => acc + (b.purchasePrice * b.currentQuantity), 0);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === 'sales') {
      csvContent += "Invoice No,Customer,Total,GST,Payment Mode,Date\n";
      sales.forEach(s => {
        csvContent += `${s.invoiceNo},"${s.customerName}",${s.grandTotal},${s.totalGst},${s.paymentMode},${s.createdAt}\n`;
      });
    } else if (reportType === 'stock') {
      csvContent += "Medicine,Batch,Expiry,Quantity,MRP,Cost Price\n";
      batches.forEach(b => {
        const med = medicines.find(m => m.id === b.medicineId);
        csvContent += `"${med?.name || ''}",${b.batchNumber},${b.expiryDate},${b.currentQuantity},${b.mrp},${b.purchasePrice}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dhanvantari_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${reportType.toUpperCase()} report to Excel CSV!`, 'success');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">ERP Reports & GST Analytics Engine</h3>
            <p className="text-xs text-slate-500">Comprehensive financial audit logs, GSTR summaries, and stock movement reports.</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel CSV</span>
        </button>
      </div>

      {/* Report Type Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'sales', label: 'Sales & Revenue Summary' },
          { id: 'gst', label: 'GSTR-1 & GSTR-3B Audit' },
          { id: 'stock', label: 'Stock Valuation Ledger' },
          { id: 'expiry', label: 'Expiry Loss Audit' },
          { id: 'fastslow', label: 'Fast vs Slow Moving Items' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setReportType(r.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              reportType === r.id 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Main Report View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
        
        {reportType === 'sales' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800">
                <span className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-300 block">Gross Sales Value</span>
                <span className="text-2xl font-black font-mono text-teal-900 dark:text-teal-100">₹{totalSalesVal.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 block">Total GST Collected</span>
                <span className="text-2xl font-black font-mono text-blue-900 dark:text-blue-100">₹{totalGstCollected.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300 block">Total Counter Bills</span>
                <span className="text-2xl font-black font-mono text-purple-900 dark:text-purple-100">{sales.length} Invoices</span>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">GST (₹)</th>
                  <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-2.5 px-3 text-center">Billed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{s.invoiceNo}</td>
                    <td className="py-2.5 px-3">{s.customerName}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-700 dark:text-teal-300">{s.paymentMode}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{s.totalGst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">₹{s.grandTotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center">{s.billedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'gst' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">GSTR-1 Monthly Tax Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Outward Taxable Value</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">₹{(totalSalesVal - totalGstCollected).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">CGST (6%)</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">₹{(totalGstCollected / 2).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">SGST (6%)</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">₹{(totalGstCollected / 2).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Total Output Tax Liability</span>
                  <span className="font-black text-sm text-teal-700 dark:text-teal-300">₹{totalGstCollected.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'stock' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Stock Valuation at MRP</span>
                <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                  ₹{totalStockValMRP.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] font-bold uppercase text-purple-800 block">Total Stock Valuation at Purchase Cost</span>
                <span className="text-2xl font-black font-mono text-purple-900 dark:text-purple-100">
                  ₹{totalStockValCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
