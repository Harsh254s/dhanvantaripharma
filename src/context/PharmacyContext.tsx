import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Medicine, MedicineBatch, Customer, Supplier, SaleInvoice, 
  PurchaseInvoice, AlertItem, AuditLog, SystemSettings, MedicineStripScanResult
} from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface PharmacyContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  medicines: Medicine[];
  batches: MedicineBatch[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
  alerts: AlertItem[];
  auditLogs: AuditLog[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scannerConnected: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  recordSale: (saleData: any) => Promise<SaleInvoice>;
  recordPurchase: (purchaseData: any) => Promise<PurchaseInvoice>;
  addMedicine: (medData: any) => Promise<Medicine>;
  updateMedicine: (id: string, medData: any) => Promise<void>;
  addBatch: (batchData: any) => Promise<MedicineBatch>;
  addCustomer: (custData: any) => Promise<Customer>;
  addSupplier: (supData: any) => Promise<Supplier>;
  markAlertRead: (alertId: string) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  scannedCode: string | null;
  setScannedCode: (code: string | null) => void;
  isStripScanOpen: boolean;
  setIsStripScanOpen: (open: boolean) => void;
  scanMedicineStrip: (base64Data?: string, rawText?: string) => Promise<MedicineStripScanResult>;
  isBarcodeScanOpen: boolean;
  setIsBarcodeScanOpen: (open: boolean) => void;
  scanBarcodeImage: (base64Data?: string, rawText?: string) => Promise<any>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    pharmacyName: "Dhanvantari Pharmacy",
    tagline: "Your Trusted Quality Healthcare Partner",
    address: "Shop #12-14, Dhanvantari Medical Complex, Station Road, City Center, PIN-400001",
    phone: "+91 98765 43210",
    email: "care@dhanvantaripharmacy.com",
    gstNo: "27AABCD1234E1Z5",
    drugLicenseNo: "20B-MH-458921 / 21B-MH-458922",
    fefoEnabled: true,
    autoQuarantineExpired: true,
    loyaltyEarnRate: 100,
    loyaltyRedeemRate: 1,
    receiptFooterMessage: "Get well soon! Medicines once sold can only be returned with valid bill within 7 days.",
    darkTheme: false
  });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [scannerConnected] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isStripScanOpen, setIsStripScanOpen] = useState<boolean>(false);
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState<boolean>(false);

  const scanMedicineStrip = async (base64Data?: string, rawText?: string): Promise<MedicineStripScanResult> => {
    const res = await fetch('/api/ocr/scan-strip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, rawText })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan medicine strip');
    }
    return await res.json();
  };

  const scanBarcodeImage = async (base64Data?: string, rawText?: string): Promise<any> => {
    const res = await fetch('/api/ocr/scan-barcode-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, rawText })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to read barcode from image');
    }
    return await res.json();
  };

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial data from Express backend
  const refreshData = useCallback(async () => {
    try {
      const [sRes, mRes, bRes, cRes, supRes, saleRes, purRes, altRes, logRes] = await Promise.all([
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/medicines').then(r => r.json()),
        fetch('/api/batches').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/purchases').then(r => r.json()),
        fetch('/api/expiry/alerts').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json())
      ]);

      if (sRes) setSettings(sRes);
      if (Array.isArray(mRes)) setMedicines(mRes);
      if (Array.isArray(bRes)) setBatches(bRes);
      if (Array.isArray(cRes)) setCustomers(cRes);
      if (Array.isArray(supRes)) setSuppliers(supRes);
      if (Array.isArray(saleRes)) setSales(saleRes);
      if (Array.isArray(purRes)) setPurchases(purRes);
      if (Array.isArray(altRes)) setAlerts(altRes);
      if (Array.isArray(logRes)) setAuditLogs(logRes);
    } catch (err) {
      console.error("Error refreshing pharmacy data:", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Dark theme class handler
  useEffect(() => {
    if (settings.darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkTheme]);

  // Global Barcode Scanner & Keyboard Shortcuts Listener
  useEffect(() => {
    let buffer = '';
    let timeoutId: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Keyboard Shortcuts: F2 = New Bill, F4 = Search, F9 = Expiry, Esc = Close Search
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
        addToast('Switched to Fast Billing Counter [F2]', 'info');
        return;
      }
      if (e.key === 'F4' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setActiveTab('expiry');
        addToast('Opened Expiry Engine [F9]', 'info');
        return;
      }

      // Barcode scanner logic (scanners type fast followed by Enter)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      
      // If typing into search bar, ignore barcode buffer
      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          const code = buffer;
          buffer = '';
          setScannedCode(code);
          addToast(`Barcode Scanned: ${code}`, 'success');
          if (activeTab !== 'billing' && activeTab !== 'medicines') {
            setActiveTab('billing');
          }
        }
        buffer = '';
        return;
      }

      if (!isInput && e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          buffer = '';
        }, 150); // USB scanner delivers keystrokes within 50-100ms
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [activeTab, addToast]);

  const updateSettings = async (newSet: Partial<SystemSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSet)
    });
    const updated = await res.json();
    setSettings(updated);
    addToast('System settings updated successfully', 'success');
  };

  const recordSale = async (saleData: any): Promise<SaleInvoice> => {
    const res = await fetch('/api/billing/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Sale failed');
    }
    const newSale = await res.json();
    await refreshData();
    addToast(`Invoice #${newSale.invoiceNo} generated! (₹${newSale.grandTotal.toFixed(2)})`, 'success');
    return newSale;
  };

  const recordPurchase = async (purchaseData: any): Promise<PurchaseInvoice> => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Purchase entry failed');
    }
    const newPur = await res.json();
    await refreshData();
    addToast(`Purchase Invoice #${newPur.invoiceNo} recorded successfully!`, 'success');
    return newPur;
  };

  const addMedicine = async (medData: any): Promise<Medicine> => {
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medData)
    });
    const newMed = await res.json();
    await refreshData();
    addToast(`Added medicine ${newMed.name}`, 'success');
    return newMed;
  };

  const updateMedicine = async (id: string, medData: any) => {
    await fetch(`/api/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medData)
    });
    await refreshData();
    addToast(`Updated medicine details`, 'success');
  };

  const addBatch = async (batchData: any): Promise<MedicineBatch> => {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    const newB = await res.json();
    await refreshData();
    addToast(`Added batch ${newB.batchNumber}`, 'success');
    return newB;
  };

  const addCustomer = async (custData: any): Promise<Customer> => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(custData)
    });
    const newC = await res.json();
    await refreshData();
    addToast(`Added customer ${newC.name}`, 'success');
    return newC;
  };

  const addSupplier = async (supData: any): Promise<Supplier> => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supData)
    });
    const newS = await res.json();
    await refreshData();
    addToast(`Added supplier ${newS.name}`, 'success');
    return newS;
  };

  const markAlertRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'read' } : a));
  };

  return (
    <PharmacyContext.Provider value={{
      settings, updateSettings, medicines, batches, customers, suppliers,
      sales, purchases, alerts, auditLogs, activeTab, setActiveTab, scannerConnected,
      toasts, addToast, removeToast, refreshData, recordSale, recordPurchase,
      addMedicine, updateMedicine, addBatch, addCustomer, addSupplier, markAlertRead,
      globalSearchQuery, setGlobalSearchQuery, isSearchOpen, setIsSearchOpen,
      scannedCode, setScannedCode, isStripScanOpen, setIsStripScanOpen, scanMedicineStrip,
      isBarcodeScanOpen, setIsBarcodeScanOpen, scanBarcodeImage
    }}>
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) throw new Error('usePharmacy must be used within a PharmacyProvider');
  return context;
};
