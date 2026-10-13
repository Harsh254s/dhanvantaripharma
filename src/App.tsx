import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastContainer } from './components/ToastContainer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MedicineStripScannerModal } from './components/MedicineStripScannerModal';
import { BarcodeImageScannerModal } from './components/BarcodeImageScannerModal';
import { LoginScreen } from './components/LoginScreen';

import { DashboardView } from './components/DashboardView';
import { BillingView } from './components/BillingView';
import { MedicinesView } from './components/MedicinesView';
import { PurchasesView } from './components/PurchasesView';
import { ExpiryView } from './components/ExpiryView';
import { CustomersSuppliersView } from './components/CustomersSuppliersView';
import { ReportsView } from './components/ReportsView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { SettingsDocsView } from './components/SettingsDocsView';

const MainContent: React.FC = () => {
  const { activeTab, settings } = usePharmacy();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className={settings.darkTheme ? 'dark' : ''}>
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${settings.darkTheme ? 'dark' : ''}`}>
      <Header />
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 lg:pb-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'billing' && <BillingView />}
        {activeTab === 'medicines' && <MedicinesView />}
        {activeTab === 'purchases' && <PurchasesView />}
        {activeTab === 'expiry' && <ExpiryView />}
        {activeTab === 'directory' && <CustomersSuppliersView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'security' && <SecurityAuditView />}
        {activeTab === 'settings' && <SettingsDocsView />}
      </main>

      <MobileBottomNav />

      <ToastContainer />
      <GlobalSearchModal />
      <MedicineStripScannerModal />
      <BarcodeImageScannerModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PharmacyProvider>
        <MainContent />
      </PharmacyProvider>
    </AuthProvider>
  );
}
