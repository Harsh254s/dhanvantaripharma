import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Settings, Database, Download, Upload, Save, BookOpen, Check } from 'lucide-react';

export const SettingsDocsView: React.FC = () => {
  const { settings, updateSettings, addToast, exportDatabaseJSON } = usePharmacy();
  const [form, setForm] = useState(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    addToast('Pharmacy profile & billing settings saved successfully!', 'success');
  };

  const handleExportDB = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dhanvantari_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast('Complete database dump exported to JSON file!', 'success');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pharmacy Settings, Backup & Documentation</h3>
            <p className="text-xs text-slate-500">Configure Drug License, GSTIN header, backup database, and review system specs.</p>
          </div>
        </div>

        <button
          onClick={handleExportDB}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-xs transition-all flex items-center gap-2"
        >
          <Database className="w-4 h-4 text-teal-400" />
          <span>Export Database JSON Backup</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pharmacy Profile Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Pharmacy Profile & GST Invoice Header
          </h4>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pharmacy Name</label>
              <input
                type="text"
                value={form.pharmacyName}
                onChange={e => setForm({ ...form, pharmacyName: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={e => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Drug License No (DL No)</label>
                <input
                  type="text"
                  value={form.drugLicenseNo}
                  onChange={e => setForm({ ...form, drugLicenseNo: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={form.gstNo}
                  onChange={e => setForm({ ...form, gstNo: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Pharmacy Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={form.receiptFooterMessage}
                onChange={e => setForm({ ...form, receiptFooterMessage: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </form>
        </div>

        {/* Operational Inventory & System Rules */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <span>Inventory Rules & Automation Settings</span>
          </h4>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">FEFO Batch Prioritization</span>
                <span className="text-slate-500 text-[11px]">Automatically suggest batches with earliest expiry dates during billing.</span>
              </div>
              <input
                type="checkbox"
                checked={form.fefoEnabled}
                onChange={e => setForm({ ...form, fefoEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Auto Quarantine Expired Batches</span>
                <span className="text-slate-500 text-[11px]">Automatically move expired stock items to the quarantine rack.</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoQuarantineExpired}
                onChange={e => setForm({ ...form, autoQuarantineExpired: e.target.checked })}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Loyalty Earn Threshold (₹)</label>
                <input
                  type="number"
                  value={form.loyaltyEarnRate}
                  onChange={e => setForm({ ...form, loyaltyEarnRate: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Loyalty Redeem Rate (₹/Pt)</label>
                <input
                  type="number"
                  value={form.loyaltyRedeemRate}
                  onChange={e => setForm({ ...form, loyaltyRedeemRate: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-900 dark:text-teal-200 block">Database Backup</span>
                <span className="text-teal-700 dark:text-teal-400 text-[11px]">Download complete JSON dump of inventory, sales, and customers.</span>
              </div>
              <button
                type="button"
                onClick={handleExportDB}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
