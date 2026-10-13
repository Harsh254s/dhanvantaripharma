import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShoppingCart, Pill, Truck, AlertTriangle, 
  Users, BarChart3, ShieldCheck, Settings, MoreHorizontal, X, Scan, Barcode, Search
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeTab, setActiveTab, alerts, 
    setIsSearchOpen, setIsStripScanOpen, setIsBarcodeScanOpen 
  } = usePharmacy();
  const { hasPermission } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  const primaryItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, module: 'Dashboard' },
    { id: 'billing', label: 'Billing', icon: <ShoppingCart className="w-5 h-5" />, badge: null, module: 'Billing' },
    { id: 'medicines', label: 'Medicines', icon: <Pill className="w-5 h-5" />, module: 'Medicines' },
    { id: 'purchases', label: 'Purchases', icon: <Truck className="w-5 h-5" />, module: 'Purchases' },
    { id: 'expiry', label: 'Expiry', icon: <AlertTriangle className="w-5 h-5" />, badge: unreadAlertsCount, module: 'Expiry' },
  ];

  const secondaryItems = [
    { id: 'directory', label: 'Customers & Suppliers', icon: <Users className="w-5 h-5" />, module: 'Customers' },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-5 h-5" />, module: 'Reports' },
    { id: 'security', label: 'Security & Audit', icon: <ShieldCheck className="w-5 h-5" />, module: 'Security' },
    { id: 'settings', label: 'System & Docs', icon: <Settings className="w-5 h-5" />, module: 'System Settings' },
  ];

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Mobile Bottom Bar (Fixed on screens < lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 dark:bg-slate-950/98 backdrop-blur-lg border-t border-slate-800 shadow-2xl px-2 py-1.5 transition-all">
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          {primaryItems.map((item) => {
            if (!hasPermission(item.module, 'read')) return null;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all active:scale-95 relative ${
                  isActive 
                    ? 'text-teal-400 font-black' 
                    : 'text-slate-400 hover:text-slate-200 font-semibold'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-black bg-rose-500 text-white rounded-full animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-teal-400 mt-0.5"></span>
                )}
              </button>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all active:scale-95 ${
              showMoreMenu ? 'text-teal-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Drawer Overlay */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end transition-opacity" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-black text-sm uppercase tracking-wider text-slate-300">
                Pharmacy ERP Operations
              </span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Scanners Quick Launchers for Mobile */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
              <button
                onClick={() => { setShowMoreMenu(false); setIsBarcodeScanOpen(true); }}
                className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-teal-400 font-bold text-xs border border-teal-500/20"
              >
                <Barcode className="w-4 h-4 shrink-0" />
                <span>Barcode Scan</span>
              </button>
              <button
                onClick={() => { setShowMoreMenu(false); setIsStripScanOpen(true); }}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-teal-700 to-teal-800 text-white font-bold text-xs rounded-xl shadow-md border border-teal-500/30"
              >
                <Scan className="w-4 h-4 shrink-0" />
                <span>AI Strip OCR</span>
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 gap-2">
              {secondaryItems.map((item) => {
                if (!hasPermission(item.module, 'read')) return null;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold text-left transition-all ${
                      isActive 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => { setShowMoreMenu(false); setIsSearchOpen(true); }}
                className="flex items-center gap-3 p-3.5 bg-slate-800/80 text-slate-300 hover:bg-slate-800 rounded-2xl text-xs font-bold text-left border border-slate-700/50 mt-1"
              >
                <Search className="w-5 h-5 text-teal-400" />
                <span>Global ERP Search (Ctrl+K)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
