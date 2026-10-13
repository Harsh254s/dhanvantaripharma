import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { Medicine, MedicineBatch } from '../types';
import { 
  Pill, Search, Plus, Edit, Barcode, ChevronRight, Layers, 
  MapPin, AlertCircle, ShieldAlert, Check, X, Printer, Scan, Sparkles
} from 'lucide-react';

export const MedicinesView: React.FC = () => {
  const { medicines, batches, addMedicine, updateMedicine, addBatch, addToast, setIsStripScanOpen } = usePharmacy();
  const { hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState<Medicine | null>(null);

  // New Medicine Form State
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    brand: '',
    manufacturer: '',
    category: 'Tablet' as Medicine['category'],
    dosageForm: 'Film Coated Tablet',
    strength: '500 mg',
    composition: '',
    packSize: '10 Tablets Strip',
    storageConditions: 'Store below 25°C',
    gstPercentage: 12,
    hsnCode: '30049099',
    prescriptionRequired: false,
    scheduleType: 'OTC' as Medicine['scheduleType'],
    barcode: '',
    description: '',
    rackLocation: 'Rack A-01',
    minStockLevel: 50
  });

  // New Batch Form State
  const [batchForm, setBatchForm] = useState({
    batchNumber: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    supplierId: 'sup-1',
    supplierName: 'Sun Pharma Distributors Pvt Ltd',
    invoiceNumber: 'INV-PUR-001',
    initialQuantity: 100,
    rackNumber: 'Rack A-01-01',
    warehouse: 'Main Store'
  });

  const categories = ['ALL', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler'];

  const filteredMedicines = medicines.filter(m => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.barcode.includes(searchQuery) ||
      m.rackLocation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMedicine({
        ...medForm,
        barcode: medForm.barcode || '890' + Math.floor(1000000000 + Math.random() * 9000000000)
      });
      setShowAddMedModal(false);
      setMedForm({
        name: '', genericName: '', brand: '', manufacturer: '', category: 'Tablet',
        dosageForm: 'Film Coated Tablet', strength: '500 mg', composition: '',
        packSize: '10 Tablets Strip', storageConditions: 'Store below 25°C',
        gstPercentage: 12, hsnCode: '30049099', prescriptionRequired: false,
        scheduleType: 'OTC', barcode: '', description: '', rackLocation: 'Rack A-01', minStockLevel: 50
      });
    } catch (err: any) {
      addToast('Failed to save medicine', 'error');
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForBatch) return;

    try {
      await addBatch({
        ...batchForm,
        medicineId: selectedMedForBatch.id,
        purchaseDate: new Date().toISOString().split('T')[0],
        currentQuantity: batchForm.initialQuantity,
        status: 'Active'
      });
      setShowAddBatchModal(false);
    } catch (err: any) {
      addToast('Failed to save batch', 'error');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter & Actions Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Filter by medicine name, generic composition, barcode, rack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-xl">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Medicine & Scan OCR Buttons */}
        {hasPermission('Medicines', 'write') && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsStripScanOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Scan className="w-4 h-4 text-teal-400" />
              <span>Scan Strip OCR</span>
            </button>

            <button
              onClick={() => setShowAddMedModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Medicine</span>
            </button>
          </div>
        )}

      </div>

      {/* Medicines Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Medicine Master Catalogue ({filteredMedicines.length})</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredMedicines.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No medicines found matching your search query or category filter.
            </div>
          ) : (
            filteredMedicines.map(med => {
              const medBatches = batches.filter(b => b.medicineId === med.id);
              const totalStock = medBatches.reduce((acc, b) => acc + b.currentQuantity, 0);
              const isLowStock = totalStock <= med.minStockLevel;
              const isExpanded = expandedMedId === med.id;

              return (
                <div key={med.id} className="transition-colors">
                  
                  {/* Medicine Row */}
                  <div 
                    onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0 font-bold">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{med.name}</h4>
                          <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                            {med.category}
                          </span>
                          {med.prescriptionRequired && (
                            <span className="px-2 py-0.2 bg-rose-100 text-rose-800 font-bold text-[10px] rounded">
                              Rx ({med.scheduleType})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{med.genericName} • Manufacturer: <b>{med.manufacturer}</b></p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Barcode: {med.barcode} • HSN: {med.hsnCode} • GST: {med.gstPercentage}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Rack Location</span>
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {med.rackLocation}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Stock</span>
                        <span className={`font-mono font-black text-sm ${isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {totalStock} Packs ({medBatches.length} Batches)
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedForBatch(med);
                          setShowAddBatchModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Batch</span>
                      </button>

                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Batch Drawer */}
                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border-t border-b border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-500" />
                          <span>Batches Ledger for {med.name}</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Batch No</th>
                              <th className="py-2 px-3">Mfg Date</th>
                              <th className="py-2 px-3">Expiry Date</th>
                              <th className="py-2 px-3 text-right">Cost Price</th>
                              <th className="py-2 px-3 text-right">Selling Rate</th>
                              <th className="py-2 px-3 text-right">MRP</th>
                              <th className="py-2 px-3 text-center">Current Qty</th>
                              <th className="py-2 px-3 text-center">Rack</th>
                              <th className="py-2 px-3">Supplier</th>
                              <th className="py-2 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {medBatches.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="p-4 text-center text-xs text-slate-400">
                                  No batches recorded yet. Click "Add Batch" to restock.
                                </td>
                              </tr>
                            ) : (
                              medBatches.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{b.batchNumber}</td>
                                  <td className="py-2 px-3 font-mono text-slate-500">{b.mfgDate}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{b.expiryDate}</td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-500">₹{b.purchasePrice.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-teal-700 dark:text-teal-300">₹{b.sellingPrice.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-500">₹{b.mrp.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-center font-extrabold text-slate-900 dark:text-white">{b.currentQuantity}</td>
                                  <td className="py-2 px-3 text-center font-mono text-[11px]">{b.rackNumber}</td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{b.supplierName}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      b.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {b.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Add Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>Register New Medicine Master Entry</span>
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pantocid 40 Tablet"
                    value={medForm.name}
                    onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Generic Composition *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pantoprazole 40mg"
                    value={medForm.genericName}
                    onChange={e => setMedForm({ ...medForm, genericName: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sun Pharma"
                    value={medForm.manufacturer}
                    onChange={e => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={medForm.category}
                    onChange={e => setMedForm({ ...medForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Tablets Strip"
                    value={medForm.packSize}
                    onChange={e => setMedForm({ ...medForm, packSize: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Rack Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-01"
                    value={medForm.rackLocation}
                    onChange={e => setMedForm({ ...medForm, rackLocation: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GST %</label>
                  <input
                    type="number"
                    value={medForm.gstPercentage}
                    onChange={e => setMedForm({ ...medForm, gstPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={medForm.hsnCode}
                    onChange={e => setMedForm({ ...medForm, hsnCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow"
                >
                  Save Medicine Master Entry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && selectedMedForBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Add Batch Stock for {selectedMedForBatch.name}
              </h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PNT25X01"
                    value={batchForm.batchNumber}
                    onChange={e => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice}
                    onChange={e => setBatchForm({ ...batchForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.sellingPrice}
                    onChange={e => setBatchForm({ ...batchForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.mrp}
                    onChange={e => setBatchForm({ ...batchForm, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Quantity Packs *</label>
                  <input
                    type="number"
                    required
                    value={batchForm.initialQuantity}
                    onChange={e => setBatchForm({ ...batchForm, initialQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow"
                >
                  Save Batch Stock
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
