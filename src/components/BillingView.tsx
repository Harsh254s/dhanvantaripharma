import React, { useState, useEffect, useRef } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { Medicine, MedicineBatch, SaleItem, Customer } from '../types';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { 
  Barcode, Search, Plus, Trash2, ShoppingCart, User, CreditCard, 
  Check, AlertTriangle, Sparkles, Printer, ArrowRight, CornerDownLeft, ShieldCheck, QrCode, Scan, Upload, Image as ImageIcon
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { 
    medicines, batches, customers, recordSale, addToast, 
    scannedCode, setScannedCode, setIsStripScanOpen, 
    setIsBarcodeScanOpen, scanBarcodeImage 
  } = usePharmacy();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[4] || { id: 'cust-5', name: 'Walk-in Customer', phone: '9000000000', loyaltyPoints: 0, pendingAmount: 0, createdAt: '' });
  const [doctorName, setDoctorName] = useState<string>('Dr. Self / Local Clinic');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [medBatches, setMedBatches] = useState<MedicineBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<MedicineBatch | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Split'>('UPI');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);

  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeImageInputRef = useRef<HTMLInputElement>(null);

  const handleDirectBarcodeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        addToast('Reading barcode from image...', 'info');
        try {
          const res = await scanBarcodeImage(base64);
          if (res.detectedBarcode) {
            addToast(`Decoded barcode: ${res.detectedBarcode}`, 'success');
            handleBarcodeLookup(res.detectedBarcode);
          } else {
            addToast('Could not decode barcode from image.', 'warning');
          }
        } catch (err: any) {
          addToast(err.message || 'Failed to scan barcode image', 'error');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Focus scanner input on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Handle scanned barcode from global listener or input
  useEffect(() => {
    if (scannedCode) {
      handleBarcodeLookup(scannedCode);
      setScannedCode(null);
    }
  }, [scannedCode]);

  const handleBarcodeLookup = async (code: string) => {
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.medicine) {
          setSelectedMed(data.medicine);
          setMedBatches(data.allBatches || []);
          
          if (data.fefoSuggestedBatch) {
            setSelectedBatch(data.fefoSuggestedBatch);
            addToast(`FEFO Batch ${data.fefoSuggestedBatch.batchNumber} suggested for ${data.medicine.name}`, 'info');
          } else if (data.allBatches && data.allBatches.length > 0) {
            setSelectedBatch(data.allBatches[0]);
          }

          if (data.warning) {
            addToast(data.warning, 'warning');
          }
        }
      } else {
        addToast(`Barcode/Batch "${code}" not found in system!`, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Medicine Selection Handler
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMed(med);
    const activeBatches = batches
      .filter(b => b.medicineId === med.id && b.currentQuantity > 0 && b.status === 'Active')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FEFO order

    setMedBatches(activeBatches);
    if (activeBatches.length > 0) {
      setSelectedBatch(activeBatches[0]); // Earliest expiring FEFO
      addToast(`Suggested FEFO batch ${activeBatches[0].batchNumber} (Exp: ${activeBatches[0].expiryDate})`, 'info');
    } else {
      setSelectedBatch(null);
      addToast(`Warning: No active stock available for ${med.name}`, 'warning');
    }
    setSearchQuery('');
  };

  // Add Item to Billing Table
  const handleAddItem = () => {
    if (!selectedMed || !selectedBatch) {
      addToast('Please select a medicine and an available batch.', 'warning');
      return;
    }

    if (quantity > selectedBatch.currentQuantity) {
      addToast(`Insufficient batch quantity! Only ${selectedBatch.currentQuantity} available.`, 'error');
      return;
    }

    // Calculate totals
    const mrp = selectedBatch.mrp;
    const unitPrice = selectedBatch.sellingPrice;
    const grossTotal = unitPrice * quantity;
    const discAmt = (grossTotal * discountPercent) / 100;
    const taxableAmt = grossTotal - discAmt;
    const gstPct = selectedMed.gstPercentage;
    const gstAmt = (taxableAmt * gstPct) / 100;
    const finalItemTotal = taxableAmt; // GST inclusive in selling price format

    const newItem: SaleItem = {
      id: 'item-' + Date.now() + Math.random().toString(36).substr(2, 4),
      medicineId: selectedMed.id,
      batchId: selectedBatch.id,
      medicineName: selectedMed.name,
      genericName: selectedMed.genericName,
      batchNumber: selectedBatch.batchNumber,
      expiryDate: selectedBatch.expiryDate,
      quantity,
      mrp,
      unitPrice,
      gstPercentage: gstPct,
      gstAmount: gstAmt,
      discountPercentage: discountPercent,
      discountAmount: discAmt,
      total: finalItemTotal
    };

    setItems(prev => [...prev, newItem]);
    addToast(`Added ${selectedMed.name} (${quantity} qty) to bill`, 'success');

    // Reset entry fields
    setSelectedMed(null);
    setSelectedBatch(null);
    setQuantity(1);
    setDiscountPercent(0);
    barcodeInputRef.current?.focus();
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Totals
  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstAmount, 0);
  const totalDiscount = items.reduce((acc, i) => acc + i.discountAmount, 0);
  const grandTotal = subtotal;

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (items.length === 0) {
      addToast('Cannot checkout empty bill!', 'warning');
      return;
    }
    setCashAmount(grandTotal);
    setUpiAmount(grandTotal);
    setCardAmount(grandTotal);
    setShowPaymentModal(true);
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    try {
      const newSale = await recordSale({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        doctorName,
        items,
        subtotal,
        totalGst,
        totalDiscount,
        grandTotal,
        paymentMode,
        cashAmount: paymentMode === 'Cash' ? grandTotal : paymentMode === 'Split' ? cashAmount : 0,
        upiAmount: paymentMode === 'UPI' ? grandTotal : paymentMode === 'Split' ? upiAmount : 0,
        cardAmount: paymentMode === 'Card' ? grandTotal : paymentMode === 'Split' ? cardAmount : 0,
        status: 'Paid',
        billedBy: currentUser.id,
        billedByName: currentUser.name
      });

      setShowPaymentModal(false);
      setCompletedInvoice(newSale);

      // Reset Bill
      setItems([]);
      setSelectedCustomer(customers[4] || { id: 'cust-5', name: 'Walk-in Customer', phone: '9000000000', loyaltyPoints: 0, pendingAmount: 0, createdAt: '' });
    } catch (err: any) {
      addToast(err.message || 'Billing error', 'error');
    }
  };

  const filteredMedicinesSearch = searchQuery.trim() ? medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.barcode.includes(searchQuery)
  ) : [];

  return (
    <div className="space-y-4">
      
      {/* Top Action Bar: Barcode Fast Scan & Customer Select */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Scanner Direct Input with Image Upload */}
        <div className="md:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-600 dark:text-teal-400">
            <Barcode className="w-5 h-5" />
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan Barcode / Batch..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                handleBarcodeLookup(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={() => barcodeImageInputRef.current?.click()}
            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            title="Upload Barcode Image File directly"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={barcodeImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleDirectBarcodeImageUpload}
            className="hidden"
          />
        </div>

        {/* Scan Barcode Image Reader Modal Button */}
        <div className="md:col-span-2">
          <button
            onClick={() => setIsBarcodeScanOpen(true)}
            className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-teal-400 border border-teal-500/30 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            title="Upload or capture barcode image to lookup item & add to bill"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>Barcode Image Reader</span>
          </button>
        </div>

        {/* OCR Strip Scan Button */}
        <div className="md:col-span-2">
          <button
            onClick={() => setIsStripScanOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5"
            title="Photograph medicine strip to read batch & expiry via OCR"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Strip OCR</span>
          </button>
        </div>

        {/* Medicine Manual Search */}
        <div className="md:col-span-4 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search medicine name / composition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchQuery.trim() !== '' && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMedicinesSearch.length === 0 ? (
                <div className="p-3 text-xs text-slate-400">No medicine matched.</div>
              ) : (
                filteredMedicinesSearch.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMedicine(m)}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.genericName}</div>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded border">
                      Rack: {m.rackLocation}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Customer Attachment */}
        <div className="md:col-span-3 flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <select
            value={selectedCustomer.id}
            onChange={(e) => {
              const found = customers.find(c => c.id === e.target.value);
              if (found) setSelectedCustomer(found);
            }}
            className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
            ))}
          </select>
        </div>

      </div>

      {/* Selected Item & FEFO Batch Selector Panel */}
      {selectedMed && (
        <div className="p-4 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 rounded-2xl space-y-3">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-teal-200 dark:border-teal-800/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{selectedMed.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-teal-600 text-white rounded-full">
                  {selectedMed.category}
                </span>
                {selectedMed.prescriptionRequired && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-rose-600 text-white rounded-full">
                    Rx Required ({selectedMed.scheduleType})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">{selectedMed.genericName} • Rack: <b>{selectedMed.rackLocation}</b></p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">GST Rate: <b>{selectedMed.gstPercentage}%</b> • HSN: <b>{selectedMed.hsnCode}</b></span>
            </div>
          </div>

          {/* Batches Selection (FEFO First) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>FEFO Batch Auto Selector (Select Batch for Billing)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {medBatches.length === 0 ? (
                <div className="col-span-full p-2 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium">
                  No active batches available for this medicine!
                </div>
              ) : (
                medBatches.map((batch, idx) => {
                  const isSelected = selectedBatch?.id === batch.id;
                  const isFEFOFirst = idx === 0;

                  return (
                    <div
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-white dark:bg-slate-900 border-teal-600 dark:border-teal-400 ring-2 ring-teal-500/20 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{batch.batchNumber}</span>
                        {isFEFOFirst && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider">
                            ★ FEFO Suggestion
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>Exp: <b className="font-mono text-slate-800 dark:text-slate-200">{batch.expiryDate}</b></span>
                        <span>Stock: <b className="font-mono text-emerald-600">{batch.currentQuantity}</b></span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-1 flex justify-between font-mono font-bold text-xs">
                        <span className="text-slate-500">MRP: ₹{batch.mrp.toFixed(2)}</span>
                        <span className="text-teal-700 dark:text-teal-300">Rate: ₹{batch.sellingPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Qty & Discount Entry */}
          {selectedBatch && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity:</span>
                <input
                  type="number"
                  min="1"
                  max={selectedBatch.currentQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Disc %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddItem}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item To Bill</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* Main Billing Items Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
            <ShoppingCart className="w-4 h-4 text-teal-600" />
            <span>Active Invoice Items ({items.length})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Customer: <b className="text-slate-800 dark:text-slate-200">{selectedCustomer.name}</b> (Pts: {selectedCustomer.loyaltyPoints})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Medicine</th>
                <th className="py-2.5 px-3 font-mono">Batch</th>
                <th className="py-2.5 px-3 font-mono">Expiry</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">MRP</th>
                <th className="py-2.5 px-3 text-right">Selling Rate</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                    Bill is empty. Scan barcode or search medicine above to add items.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-mono text-[11px] font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {item.medicineName}
                      <span className="block text-[10px] text-slate-400 font-normal">{item.genericName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{item.batchNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{item.expiryDate}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 dark:text-white">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{item.mrp.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-500 font-semibold">{item.discountPercentage}%</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{item.gstPercentage}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-teal-700 dark:text-teal-300">₹{item.total.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Checkout Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Items Count</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{items.length} Lines</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Taxable GST</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">₹{totalGst.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Discount</span>
              <span className="font-mono font-bold text-rose-600 text-sm">-₹{totalDiscount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Grand Total</span>
              <span className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={items.length === 0}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Checkout / Pay [F8]</span>
            </button>
          </div>

        </div>

      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <span>Complete Payment & Issue Invoice</span>
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Net Payable Amount</span>
              <span className="text-xl font-black font-mono text-teal-700 dark:text-teal-300">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">Select Payment Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'Card', 'Split'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                      paymentMode === mode 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI QR Simulator */}
            {paymentMode === 'UPI' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <div className="w-32 h-32 bg-white p-2 rounded-xl border mx-auto shadow-sm flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Scan UPI QR Code to pay ₹{grandTotal.toFixed(2)}</p>
                <p className="text-[11px] font-mono text-slate-500">UPI ID: dhanvantari@okicici</p>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Confirm Payment & Print GST Bill</span>
            </button>

          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {completedInvoice && (
        <PrintInvoiceModal 
          invoice={completedInvoice} 
          onClose={() => setCompletedInvoice(null)} 
        />
      )}

    </div>
  );
};
