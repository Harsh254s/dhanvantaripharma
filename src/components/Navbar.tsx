import React from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShoppingCart, Pill, Truck, AlertTriangle, 
  Users, BarChart3, ShieldCheck, Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  badge?: number;
  module: string;
}

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, alerts } = usePharmacy();
  const { hasPermission } = useAuth();

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, module: 'Dashboard' },
    { id: 'billing', label: 'Billing Counter', icon: <ShoppingCart className="w-4 h-4" />, shortcut: 'F2', module: 'Billing' },
    { id: 'medicines', label: 'Medicines & Batches', icon: <Pill className="w-4 h-4" />, module: 'Medicines' },
    { id: 'purchases', label: 'Purchase & AI OCR', icon: <Truck className="w-4 h-4" />, module: 'Purchases' },
    { id: 'expiry', label: 'Expiry Engine', icon: <AlertTriangle className="w-4 h-4" />, shortcut: 'F9', badge: unreadAlertsCount, module: 'Expiry' },
    { id: 'directory', label: 'Customers & Suppliers', icon: <Users className="w-4 h-4" />, module: 'Customers' },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, module: 'Reports' },
    { id: 'security', label: 'Security & Audit', icon: <ShieldCheck className="w-4 h-4" />, module: 'Security' },
    { id: 'settings', label: 'System & Docs', icon: <Settings className="w-4 h-4" />, module: 'System Settings' },
  ];

  return (
    <nav className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-2 sm:px-6 py-1.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-start xl:justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const canAccess = hasPermission(item.module, 'read');
          if (!canAccess) return null;

          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-lg shadow-teal-950/40 border border-teal-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-teal-200' : 'text-slate-400 group-hover:text-slate-200'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.shortcut && (
                <span className={`px-1.5 py-0.5 font-mono font-bold text-[10px] rounded-md ${isActive ? 'bg-teal-900/90 text-teal-200 border border-teal-400/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {item.shortcut}
                </span>
              )}
              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full shadow-sm animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
