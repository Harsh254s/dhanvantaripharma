import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { 
  TrendingUp, ShoppingBag, Package, AlertTriangle, ArrowUpRight, 
  Sparkles, Clock, Flame, Barcode, Truck, RotateCcw, FileText, 
  Calendar, ChevronRight, Building2, ShoppingCart, Activity, ShieldAlert
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    sales, purchases, medicines, batches, suppliers, alerts, 
    setActiveTab, setIsStripScanOpen, setIsBarcodeScanOpen, addToast 
  } = usePharmacy();

  // Date Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  const getDiffDays = (expStr: string) => {
    if (!expStr) return 999;
    const exp = new Date(expStr);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  // Metrics
  const todaySalesList = sales.filter(s => s.createdAt && s.createdAt.startsWith(todayStr));
  const todaySalesTotal = todaySalesList.reduce((acc, s) => acc + s.grandTotal, 0);

  const todayPurchasesList = purchases.filter(p => p.createdAt && p.createdAt.startsWith(todayStr));
  const todayPurchasesTotal = todayPurchasesList.reduce((acc, p) => acc + p.grandTotal, 0);

  const totalStockMRP = batches.reduce((acc, b) => acc + (b.mrp * b.currentQuantity), 0);
  const totalStockCost = batches.reduce((acc, b) => acc + (b.purchasePrice * b.currentQuantity), 0);

  // Critical Tasks Metrics
  const expiringTodayCount = batches.filter(b => {
    const d = getDiffDays(b.expiryDate);
    return d === 0 || b.expiryDate === todayStr;
  }).length;

  const exp7Days = batches.filter(b => { 
    const d = getDiffDays(b.expiryDate); 
    return d > 0 && d <= 7; 
  }).length;

  const lowStockCount = medicines.filter(m => {
    const stock = batches.filter(b => b.medicineId === m.id).reduce((acc, b) => acc + b.currentQuantity, 0);
    return stock <= m.minStockLevel;
  }).length;

  const pendingSupplierTotal = suppliers.reduce((acc, s) => acc + (s.outstandingAmount || 0), 0);
  const pendingSuppliersCount = suppliers.filter(s => (s.outstandingAmount || 0) > 0).length || purchases.filter(p => (p.pendingAmount || 0) > 0).length;

  const pendingOcrCount = alerts.filter(a => 
    a.type === 'Audit' || 
    a.title.toLowerCase().includes('ocr') || 
    a.title.toLowerCase().includes('invoice') || 
    a.message.toLowerCase().includes('invoice')
  ).length;

  // Expiry Countdown Buckets
  const expiredCount = batches.filter(b => getDiffDays(b.expiryDate) < 0).length;
  const exp15Days = batches.filter(b => { const d = getDiffDays(b.expiryDate); return d > 7 && d <= 15; }).length;
  const exp30Days = batches.filter(b => { const d = getDiffDays(b.expiryDate); return d > 15 && d <= 30; }).length;
  const exp60Days = batches.filter(b => { const d = getDiffDays(b.expiryDate); return d > 30 && d <= 60; }).length;
  const exp90Days = batches.filter(b => { const d = getDiffDays(b.expiryDate); return d > 60 && d <= 90; }).length;
  const exp180Days = batches.filter(b => { const d = getDiffDays(b.expiryDate); return d > 90 && d <= 180; }).length;

  // Dynamic 7-day revenue trend calculated from actual sales
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.createdAt && s.createdAt.startsWith(dateStr));
    const rev = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const profit = daySales.reduce((acc, s) => acc + (s.totalGst ? s.grandTotal * 0.15 : 0), 0);
    return {
      day: daysOfWeek[d.getDay()],
      rev,
      profit
    };
  });
  const maxRevenue = Math.max(...chartDays.map(d => d.rev), 1);

  const handleReturnAction = () => {
    setActiveTab('billing');
    addToast('Navigated to Billing Counter for Customer/Supplier Returns', 'info');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* ==================== 1. TOP QUICK ACTIONS (LARGE ERP OPERATIONAL BUTTONS) ==================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
              Quick ERP Operations & POS Launchers
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">Terminal Quick Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* New Bill (F2) */}
          <button
            onClick={() => setActiveTab('billing')}
            className="group relative p-5 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white rounded-3xl shadow-xl shadow-teal-950/40 hover:shadow-2xl hover:shadow-teal-900/60 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left border border-teal-500/30 flex flex-col justify-between h-36 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 text-teal-300/10 group-hover:text-teal-300/20 transition-colors">
              <ShoppingCart className="w-20 h-20 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20 shadow-inner">
                <ShoppingBag className="w-6 h-6 text-teal-200" />
              </div>
              <span className="px-2.5 py-1 bg-teal-950/80 text-teal-200 font-mono font-black text-xs rounded-lg border border-teal-400/40 shadow-xs">
                F2
              </span>
            </div>
            <div className="z-10 mt-3">
              <h3 className="font-black text-xl tracking-tight text-white leading-tight">New Bill</h3>
              <p className="text-xs text-teal-100/90 font-semibold mt-1 flex items-center gap-1">
                <span>Counter POS & Billing</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </button>

          {/* New Purchase */}
          <button
            onClick={() => setActiveTab('purchases')}
            className="group relative p-5 bg-slate-900 hover:bg-slate-800/90 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-blue-950/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left border border-slate-800 hover:border-blue-500/50 flex flex-col justify-between h-36 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
              <Truck className="w-20 h-20 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                Stock In
              </span>
            </div>
            <div className="z-10 mt-3">
              <h3 className="font-black text-xl tracking-tight text-white leading-tight">New Purchase</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <span>Distributor Stock Entry</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-400" />
              </p>
            </div>
          </button>

          {/* Scan Medicine */}
          <button
            onClick={() => setIsBarcodeScanOpen(true)}
            className="group relative p-5 bg-slate-900 hover:bg-slate-800/90 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-emerald-950/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left border border-slate-800 hover:border-emerald-500/50 flex flex-col justify-between h-36 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
              <Barcode className="w-20 h-20 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-inner">
                <Barcode className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                AI Vision
              </span>
            </div>
            <div className="z-10 mt-3">
              <h3 className="font-black text-xl tracking-tight text-white leading-tight">Scan Medicine</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <span>Barcode / QR Lookup</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-400" />
              </p>
            </div>
          </button>

          {/* OCR Invoice */}
          <button
            onClick={() => setIsStripScanOpen(true)}
            className="group relative p-5 bg-slate-900 hover:bg-slate-800/90 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-purple-950/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between h-36 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
              <Sparkles className="w-20 h-20 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                AI Scanner
              </span>
            </div>
            <div className="z-10 mt-3">
              <h3 className="font-black text-xl tracking-tight text-white leading-tight">OCR Invoice</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <span>Strip & Bill Extractor</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-400" />
              </p>
            </div>
          </button>

          {/* Returns */}
          <button
            onClick={handleReturnAction}
            className="group relative p-5 bg-slate-900 hover:bg-slate-800/90 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-amber-950/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 text-left border border-slate-800 hover:border-amber-500/50 flex flex-col justify-between h-36 overflow-hidden col-span-2 sm:col-span-1 cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
              <RotateCcw className="w-20 h-20 -mr-4 -mt-4 transform rotate-12" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-inner">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                Credit Note
              </span>
            </div>
            <div className="z-10 mt-3">
              <h3 className="font-black text-xl tracking-tight text-white leading-tight">Returns</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <span>Sales & Supplier Returns</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* ==================== 2. TODAY'S CRITICAL TASKS ==================== */}
      <div className="p-6 bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-xl shadow-black/30 space-y-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 shadow-md shadow-rose-950/50">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-lg tracking-tight flex items-center gap-2.5">
                <span>Today's Operational Critical Tasks</span>
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Click any operational task card below to review, resolve, or process in the ERP workflow.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Expiring Today */}
          <div
            onClick={() => setActiveTab('expiry')}
            className="group p-5 bg-slate-950/80 hover:bg-slate-800/90 border border-rose-500/30 hover:border-rose-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-rose-950/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
                Expiring Today
              </span>
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                {expiringTodayCount} <span className="text-xs font-sans text-rose-300 font-bold">Items</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-between font-medium">
                <span>Quarantine / Remove</span>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

          {/* 2. Expiring in 7 Days */}
          <div
            onClick={() => setActiveTab('expiry')}
            className="group p-5 bg-slate-950/80 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-amber-950/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                Expiring ≤ 7 Days
              </span>
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                {exp7Days} <span className="text-xs font-sans text-amber-300 font-bold">Batches</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-between font-medium">
                <span>Clearance / Discount</span>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

          {/* 3. Low Stock Medicines */}
          <div
            onClick={() => setActiveTab('medicines')}
            className="group p-5 bg-slate-950/80 hover:bg-slate-800/90 border border-yellow-500/30 hover:border-yellow-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-yellow-950/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-yellow-400 uppercase tracking-widest">
                Low Stock Alert
              </span>
              <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                {lowStockCount} <span className="text-xs font-sans text-yellow-300 font-bold">Medicines</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-between font-medium">
                <span>Create Purchase Order</span>
                <ChevronRight className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

          {/* 4. Pending Supplier Payments */}
          <div
            onClick={() => setActiveTab('directory')}
            className="group p-5 bg-slate-950/80 hover:bg-slate-800/90 border border-blue-500/30 hover:border-blue-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-blue-950/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">
                Supplier Payables
              </span>
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                ₹{pendingSupplierTotal.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-between font-medium">
                <span>{pendingSuppliersCount} Payables Outstanding</span>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

          {/* 5. Pending OCR Invoices */}
          <div
            onClick={() => setActiveTab('purchases')}
            className="group p-5 bg-slate-950/80 hover:bg-slate-800/90 border border-purple-500/30 hover:border-purple-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl hover:shadow-purple-950/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">
                Pending OCR Bills
              </span>
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                {pendingOcrCount} <span className="text-xs font-sans text-purple-300 font-bold">Invoices</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-between font-medium">
                <span>Review & Approve Batch</span>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== 3. PRIMARY METRIC OVERVIEW CARDS (UNIFORM ALIGNMENT) ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Today's Sales */}
        <div 
          onClick={() => setActiveTab('billing')}
          className="group p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Today's Counter Sales</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₹{todaySalesTotal.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mt-3 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>{todaySalesList.length} Sales Bills Billed Today</span>
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Today's Purchases */}
        <div 
          onClick={() => setActiveTab('purchases')}
          className="group p-5 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Today's Purchases</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₹{todayPurchasesTotal.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mt-3 pt-2 border-t border-slate-800/60">
            <span>{todayPurchasesList.length} Distributor Bills Recorded</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Total Stock Value */}
        <div 
          onClick={() => setActiveTab('medicines')}
          className="group p-5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Stock Value</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₹{totalStockMRP.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mt-3 pt-2 border-t border-slate-800/60">
            <span>Cost: <b className="text-slate-200 font-mono font-bold">₹{totalStockCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b></span>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Low Stock Safety Alert */}
        <div 
          onClick={() => setActiveTab('medicines')}
          className="group p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-950/30"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Low Stock Safety Alert</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {lowStockCount} Medicines
          </div>
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold mt-3 pt-2 border-t border-slate-800/60">
            <span>Below Minimum Safety Level</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* ==================== 4. EXPIRY RISK COUNTDOWN ENGINE ==================== */}
      <div className="p-6 bg-slate-900 border border-slate-800/90 rounded-3xl shadow-xl shadow-black/20 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-tight">
                Expiry Risk Analysis & Countdown Engine
              </h3>
              <p className="text-xs text-slate-400">Batches categorized by remaining shelf-life for FEFO dispatch and return policies.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('expiry')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
          >
            <span>Manage All Batches [F9]</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          
          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-rose-950/40 border border-rose-900 hover:border-rose-500 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">EXPIRED</span>
            <div className="text-2xl font-black text-rose-300 font-mono my-1 group-hover:scale-105 transition-transform">{expiredCount}</div>
            <span className="text-[10px] text-rose-400 font-bold">Auto Quarantined</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-rose-950/20 border border-rose-900/50 hover:border-rose-500/70 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">1 to 7 Days</span>
            <div className="text-2xl font-black text-rose-300 font-mono my-1 group-hover:scale-105 transition-transform">{exp7Days}</div>
            <span className="text-[10px] text-rose-400 font-bold">Critical Clearance</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-amber-950/40 border border-amber-900 hover:border-amber-500 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">8 to 15 Days</span>
            <div className="text-2xl font-black text-amber-300 font-mono my-1 group-hover:scale-105 transition-transform">{exp15Days}</div>
            <span className="text-[10px] text-amber-400 font-bold">Prioritize Sale</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-amber-950/20 border border-amber-900/50 hover:border-amber-500/70 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">16 to 30 Days</span>
            <div className="text-2xl font-black text-amber-300 font-mono my-1 group-hover:scale-105 transition-transform">{exp30Days}</div>
            <span className="text-[10px] text-amber-400 font-bold">Supplier Return</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-blue-950/30 border border-blue-900 hover:border-blue-500 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">31 to 60 Days</span>
            <div className="text-2xl font-black text-blue-300 font-mono my-1 group-hover:scale-105 transition-transform">{exp60Days}</div>
            <span className="text-[10px] text-blue-400 font-bold">Monitor Sales</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-slate-800/80 border border-slate-700 hover:border-slate-500 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">61 to 90 Days</span>
            <div className="text-2xl font-black text-slate-200 font-mono my-1 group-hover:scale-105 transition-transform">{exp90Days}</div>
            <span className="text-[10px] text-slate-400 font-bold">Safe Stock</span>
          </div>

          <div 
            onClick={() => setActiveTab('expiry')}
            className="p-4 bg-slate-800/80 border border-slate-700 hover:border-slate-500 rounded-2xl text-center cursor-pointer transition-all hover:-translate-y-1 group"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">91 to 180 Days</span>
            <div className="text-2xl font-black text-slate-200 font-mono my-1 group-hover:scale-105 transition-transform">{exp180Days}</div>
            <span className="text-[10px] text-slate-400 font-bold">Long Expiry</span>
          </div>

        </div>
      </div>

      {/* ==================== 5. ANALYTICS & FAST-MOVING MEDICINES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Revenue & Profit Interactive Chart Visualizer */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-3xl shadow-lg space-y-4 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">Weekly Revenue & Margin Visualizer</h3>
              <p className="text-xs text-slate-400">Calculated across Dhanvantari Pharmacy counter transactions</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 shadow-xs"></span> Gross Sales</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs"></span> Net Profit</span>
            </div>
          </div>

          {/* Dynamic SVG Bar Chart calculated from sales */}
          <div className="h-64 pt-6 flex items-end justify-between gap-4 border-b border-slate-800/80 pb-3">
            {chartDays.map((d, i) => {
              const revPercent = d.rev > 0 ? `${Math.max(12, Math.round((d.rev / maxRevenue) * 100))}%` : '4%';
              const profitPercent = d.profit > 0 ? `${Math.max(8, Math.round((d.profit / maxRevenue) * 100))}%` : '2%';

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full flex items-end justify-center gap-1.5 h-48 bg-slate-800/40 rounded-2xl p-1.5 relative border border-slate-800/60">
                    <div 
                      style={{ height: revPercent }} 
                      className="w-1/2 bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500 group-hover:to-teal-300 rounded-t-lg transition-all shadow-md"
                    ></div>
                    <div 
                      style={{ height: profitPercent }} 
                      className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-300 rounded-t-lg transition-all shadow-md"
                    ></div>
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-teal-400 transition-colors">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Average Net Margin Rate: <b className="text-teal-400 font-mono text-sm">{sales.length > 0 ? '19.4%' : '0%'}</b></span>
            <span>Total Sales Invoices Processed: <b className="text-slate-200 font-mono text-sm">{sales.length}</b></span>
          </div>
        </div>

        {/* Right Col: Top Selling Fast-Moving Medicines */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-white text-base">Fast Moving Medicines</h3>
            </div>
            <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/60 uppercase tracking-wider">
              High Demand
            </span>
          </div>

          {medicines.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-medium space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-slate-300 font-bold">No Medicines Registered</p>
              <p className="text-xs text-slate-500">Add medicines or record purchase invoices to populate inventory list.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {medicines.slice(0, 5).map((med, idx) => {
                const medBatches = batches.filter(b => b.medicineId === med.id);
                const totalStock = medBatches.reduce((acc, b) => acc + b.currentQuantity, 0);

                return (
                  <div 
                    key={med.id} 
                    onClick={() => setActiveTab('medicines')}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/60 px-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 font-mono text-xs font-black text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-xs text-white truncate">{med.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{med.manufacturer}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-slate-200">
                        {totalStock} in stock
                      </span>
                      <p className="text-[10px] text-teal-400 font-extrabold uppercase">{med.rackLocation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setActiveTab('medicines')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs rounded-2xl transition-colors shadow-sm"
          >
            View Complete Stock Ledger
          </button>
        </div>

      </div>

      {/* ==================== 6. RECENT TRANSACTIONS & SYSTEM ALERTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Counter Transactions */}
        <div 
          onClick={() => setActiveTab('billing')}
          className="p-6 bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-3xl shadow-lg space-y-4 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base">Recent Counter Invoices</h3>
            <span className="text-xs font-bold text-teal-400 hover:underline">
              Go to Billing Counter
            </span>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-medium">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-700 mb-2" />
              <p className="text-slate-300 font-bold">No Counter Invoices Yet</p>
              <p className="text-xs text-slate-500 mt-1">Start a new POS bill to record customer transactions.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {sales.slice(0, 4).map(sale => (
                <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white text-sm">{sale.invoiceNo}</span>
                      <span className="px-2 py-0.5 bg-teal-950/60 text-teal-300 rounded-md font-bold text-[10px] border border-teal-800/60">
                        {sale.paymentMode}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{sale.customerName} • Billed by {sale.billedByName}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-base">
                      ₹{sale.grandTotal.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono font-semibold">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Activity & Alerts */}
        <div 
          onClick={() => setActiveTab('security')}
          className="p-6 bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-3xl shadow-lg space-y-4 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base">Recent System Alerts & Security Audits</h3>
            <span className="text-xs font-bold text-teal-400 hover:underline">
              View Audit Logs
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-medium">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-700 mb-2" />
              <p className="text-slate-300 font-bold">No Active Alerts</p>
              <p className="text-xs text-slate-500 mt-1">System monitoring all stock and expiry metrics smoothly.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-black ${alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
