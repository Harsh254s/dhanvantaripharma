import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { PurchaseItem, PurchaseInvoice } from '../types';
import { 
  Truck, Sparkles, Upload, FileText, Plus, Trash2, Check, 
  AlertCircle, ArrowRight, CheckCircle2, RefreshCw
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { suppliers, recordPurchase, medicines, addToast } = usePharmacy();

  const [activeSubTab, setActiveSubTab] = useState<'ocr' | 'manual' | 'history'>('ocr');
  const [ocrLoading, setOcrLoading] = useState(false);
  
  // OCR Form / Matrix State
  const [supplierName, setSupplierName] = useState('Sun Pharma Distributors Pvt Ltd');
  const [supplierGst, setSupplierGst] = useState('27AAAAA0000A1Z5');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-SUN-' + Math.floor(1000 + Math.random() * 9000));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: 'pitem-1',
      medicineId: medicines[0]?.id || 'med-1',
      medicineName: 'Pantocid 40 Tablet',
      genericName: 'Pantoprazole Gastro-resistant 40mg',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      batchNumber: 'PNT25Z09',
      mfgDate: '2025-02-01',
      expiryDate: '2027-08-31',
      quantity: 200,
      purchaseRate: 112.00,
      mrp: 168.00,
      sellingPrice: 155.00,
      gstPercentage: 12,
      discountPercentage: 2,
      hsnCode: '30049099',
      total: 22400.00
    }
  ]);

  // AI OCR Upload Handler (Simulates or uploads image base64 to server-side Gemini)
  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    addToast('Uploading distributor invoice image to Gemini AI OCR...', 'info');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/ocr/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.supplierName) setSupplierName(data.supplierName);
          if (data.supplierGst) setSupplierGst(data.supplierGst);
          if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
          if (data.invoiceDate) setInvoiceDate(data.invoiceDate);

          if (data.items && Array.isArray(data.items)) {
            const mappedItems: PurchaseItem[] = data.items.map((it: any, idx: number) => ({
              id: 'pitem-' + Date.now() + idx,
              medicineId: it.matchedMedicineId || medicines[0]?.id || 'med-1',
              medicineName: it.medicineName,
              genericName: it.genericName || 'Formula Composition',
              manufacturer: it.manufacturer || 'Pharma Corp',
              batchNumber: it.batchNumber,
              mfgDate: it.mfgDate || '2025-01-01',
              expiryDate: it.expiryDate || '2027-06-30',
              quantity: it.quantity || 100,
              purchaseRate: it.purchaseRate || 100,
              mrp: it.mrp || 150,
              sellingPrice: it.sellingPrice || 140,
              gstPercentage: it.gstPercentage || 12,
              discountPercentage: 0,
              hsnCode: it.hsnCode || '30049099',
              total: (it.purchaseRate || 100) * (it.quantity || 100)
            }));
            setItems(mappedItems);
            addToast(`Successfully extracted ${mappedItems.length} items from invoice via Gemini AI!`, 'success');
          }
        } else {
          addToast('AI OCR failed to extract document. Using sample data matrix.', 'warning');
        }
      } catch (err) {
        addToast('Error in AI OCR process', 'error');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Sample AI OCR Demo
  const handleTriggerSampleOCR = async () => {
    setOcrLoading(true);
    addToast('Processing sample distributor bill with Gemini 3.6 Flash...', 'info');

    const sampleText = `
SUN PHARMA DISTRIBUTORS PVT LTD
GSTIN: 27AAAAA0000A1Z5 | DL: DL-20B-10021
INVOICE NO: INV-SUN-9981 | DATE: 2026-07-31

ITEMS LIST:
1. PANTOCID 40 TAB | BATCH: PNT26M01 | EXP: 2028-03-31 | QTY: 300 | RATE: 110.00 | MRP: 168.00 | GST: 12%
2. DOLO 650 TAB | BATCH: DLO26K04 | EXP: 2028-01-31 | QTY: 500 | RATE: 21.00 | MRP: 34.00 | GST: 12%
3. SHELCAL 500 TAB | BATCH: SHL26P12 | EXP: 2028-05-31 | QTY: 200 | RATE: 90.00 | MRP: 138.00 | GST: 12%
    `;

    try {
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: sampleText })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.supplierName) setSupplierName(data.supplierName);
        if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
        if (data.items && Array.isArray(data.items)) {
          const mappedItems: PurchaseItem[] = data.items.map((it: any, idx: number) => ({
            id: 'pitem-demo-' + idx,
            medicineId: it.matchedMedicineId || medicines[0]?.id || 'med-1',
            medicineName: it.medicineName,
            genericName: it.genericName || 'Formula Composition',
            manufacturer: it.manufacturer || 'Pharma Corp',
            batchNumber: it.batchNumber,
            mfgDate: it.mfgDate || '2025-01-01',
            expiryDate: it.expiryDate || '2028-03-31',
            quantity: it.quantity || 100,
            purchaseRate: it.purchaseRate || 100,
            mrp: it.mrp || 150,
            sellingPrice: it.sellingPrice || 140,
            gstPercentage: it.gstPercentage || 12,
            discountPercentage: 0,
            hsnCode: it.hsnCode || '30049099',
            total: (it.purchaseRate || 100) * (it.quantity || 100)
          }));
          setItems(mappedItems);
          addToast(`AI extracted ${mappedItems.length} medicine items! Review matrix below.`, 'success');
        }
      }
    } catch (err) {
      addToast('AI processing error', 'error');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleUpdateItem = (id: string, field: keyof PurchaseItem, val: any) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: val };
        if (field === 'purchaseRate' || field === 'quantity') {
          updated.total = updated.purchaseRate * updated.quantity;
        }
        return updated;
      }
      return i;
    }));
  };

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const totalGst = items.reduce((acc, i) => acc + (i.total * (i.gstPercentage / 100)), 0);
  const grandTotal = subtotal + totalGst;

  const handleSavePurchase = async () => {
    if (items.length === 0) {
      addToast('Cannot save empty purchase entry', 'warning');
      return;
    }

    try {
      const selectedSup = suppliers.find(s => s.name === supplierName) || suppliers[0];
      await recordPurchase({
        invoiceNo: invoiceNumber,
        supplierId: selectedSup.id,
        supplierName: selectedSup.name,
        supplierGst,
        invoiceDate,
        items,
        subtotal,
        totalGst,
        totalDiscount: 0,
        grandTotal,
        paidAmount: grandTotal,
        pendingAmount: 0,
        createdBy: 'Inventory Manager'
      });

      addToast(`Purchase Invoice #${invoiceNumber} saved! Inventory batches auto-updated.`, 'success');
      setItems([]);
    } catch (err: any) {
      addToast('Failed to record purchase entry', 'error');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Purchase Management & AI OCR Invoice Entry</h3>
            <p className="text-xs text-slate-500">Scan distributor bills to auto-fill batches, purchase rates, and expiry dates.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSampleOCR}
            disabled={ocrLoading}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{ocrLoading ? 'AI Processing...' : 'Run Demo AI OCR Parser'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-6 bg-white dark:bg-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-800/80 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
          {ocrLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Upload Distributor Invoice / Purchase Bill Photo
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Supports PNG, JPG, JPEG, and PDF documents</p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all">
          <Upload className="w-4 h-4" />
          <span>Browse Invoice File</span>
          <input type="file" accept="image/*,application/pdf" onChange={handleOCRUpload} className="hidden" />
        </label>
      </div>

      {/* Extracted Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4">
        
        {/* Supplier & Invoice Header Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Distributor / Supplier</label>
            <input
              type="text"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Supplier GSTIN</label>
            <input
              type="text"
              value={supplierGst}
              onChange={e => setSupplierGst(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Items Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Medicine Name</th>
                <th className="py-2.5 px-3">Batch Number</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-center">Qty Packs</th>
                <th className="py-2.5 px-3 text-right">Purchase Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Selling Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 font-mono font-bold">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={e => handleUpdateItem(item.id, 'medicineName', e.target.value)}
                      className="w-full p-1 bg-transparent font-bold text-slate-900 dark:text-white border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <input
                      type="text"
                      value={item.batchNumber}
                      onChange={e => handleUpdateItem(item.id, 'batchNumber', e.target.value)}
                      className="w-32 p-1 bg-transparent font-bold text-amber-600 border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={e => handleUpdateItem(item.id, 'expiryDate', e.target.value)}
                      className="w-32 p-1 bg-transparent text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 text-center font-mono">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-16 p-1 bg-transparent text-center font-bold border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      step="0.01"
                      value={item.purchaseRate}
                      onChange={e => handleUpdateItem(item.id, 'purchaseRate', parseFloat(e.target.value) || 0)}
                      className="w-20 p-1 bg-transparent text-right font-bold border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={e => handleUpdateItem(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                      className="w-20 p-1 bg-transparent text-right font-bold text-teal-700 dark:text-teal-300 border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <input
                      type="number"
                      step="0.01"
                      value={item.mrp}
                      onChange={e => handleUpdateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)}
                      className="w-20 p-1 bg-transparent text-right border-b border-transparent hover:border-slate-300"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">{item.gstPercentage}%</td>
                  <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                    ₹{item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">Grand Purchase Value</span>
            <span className="text-xl font-black font-mono text-teal-700 dark:text-teal-300">₹{grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handleSavePurchase}
            disabled={items.length === 0}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Update Stock Inventory</span>
          </button>
        </div>

      </div>

    </div>
  );
};
