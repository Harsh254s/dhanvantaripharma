import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Search, X, Pill, Barcode, Layers, Users, FileText, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, medicines, batches, customers, suppliers, sales, setActiveTab } = usePharmacy();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredMeds = q ? medicines.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.genericName.toLowerCase().includes(q) || 
    m.barcode.includes(q) ||
    m.brand.toLowerCase().includes(q) ||
    m.rackLocation.toLowerCase().includes(q)
  ) : [];

  const filteredBatches = q ? batches.filter(b => 
    b.batchNumber.toLowerCase().includes(q) || 
    b.invoiceNumber.toLowerCase().includes(q)
  ) : [];

  const filteredCust = q ? customers.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.phone.includes(q)
  ) : [];

  const filteredSup = q ? suppliers.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.gstNumber.toLowerCase().includes(q)
  ) : [];

  const filteredSales = q ? sales.filter(s => 
    s.invoiceNo.toLowerCase().includes(q) || 
    s.customerName.toLowerCase().includes(q)
  ) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search Dhanvantari Pharmacy ERP (Medicines, Barcodes, Batches, Customers, Invoices)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <p className="font-semibold text-slate-600 dark:text-slate-300">Fast Global Search Engine</p>
              <p className="mt-1">Type a medicine name, manufacturer, barcode, batch number, or customer phone.</p>
            </div>
          ) : (
            <>
              {/* Medicines */}
              {filteredMeds.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-500" />
                    <span>Medicines ({filteredMeds.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredMeds.slice(0, 5).map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveTab('medicines');
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.genericName} • {m.packSize}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] px-2 py-0.5 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                            Rack: {m.rackLocation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batches */}
              {filteredBatches.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-amber-500" />
                    <span>Batches ({filteredBatches.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredBatches.slice(0, 4).map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveTab('medicines');
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{b.batchNumber}</span>
                          <span className="ml-2 text-slate-500">Exp: {b.expiryDate}</span>
                        </div>
                        <div className="text-right font-semibold text-slate-700 dark:text-slate-300">
                          MRP ₹{b.mrp.toFixed(2)} • Stock: {b.currentQuantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {filteredCust.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Customers ({filteredCust.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredCust.slice(0, 3).map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveTab('directory');
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                          <span className="ml-2 text-slate-500 font-mono">{c.phone}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded text-[11px]">
                          Points: {c.loyaltyPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {filteredSales.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Sale Invoices ({filteredSales.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredSales.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveTab('billing');
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{s.invoiceNo}</span>
                          <span className="ml-2 text-slate-500">{s.customerName}</span>
                        </div>
                        <span className="font-bold text-emerald-600">₹{s.grandTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredMeds.length === 0 && filteredBatches.length === 0 && filteredCust.length === 0 && filteredSales.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching records found for "{query}".
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono">Esc</kbd> to exit</span>
          <span className="text-teal-600 dark:text-teal-400 font-semibold">Dhanvantari Search Index Active</span>
        </div>

      </div>
    </div>
  );
};
