import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { 
  Pill, Bell, Search, Barcode, Sun, Moon, Shield, User, ChevronDown, 
  AlertTriangle, Scan, LogOut, KeyRound, Mail, Phone, Activity
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    settings, updateSettings, alerts, markAlertRead, 
    setIsSearchOpen, setIsStripScanOpen, setIsBarcodeScanOpen, 
    setActiveTab, addToast 
  } = usePharmacy();
  const { currentUser, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const unreadAlerts = alerts.filter(a => a.status === 'unread');

  if (!currentUser) return null;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 px-3 sm:px-5 py-2.5 sm:py-3 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Branding & Pharmacy Enterprise Info */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/30 font-black text-xl sm:text-2xl border border-teal-400/20 group cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('dashboard')}>
            <Pill className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-black text-slate-900 dark:text-white text-sm sm:text-lg tracking-tight leading-none">
                {settings.pharmacyName}
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 rounded-full shadow-xs">
                Main ERP Terminal #01
              </span>
            </div>
            <p className="hidden sm:flex text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 items-center gap-2">
              <span>GST: <b className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{settings.gstNo}</b></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>DL: <b className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{settings.drugLicenseNo}</b></span>
            </p>
          </div>
        </div>

        {/* Center: Quick Search Bar & Scanner Status */}
        <div className="flex-1 max-w-2xl flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 min-w-0 flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all shadow-inner group"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-teal-400 transition-colors shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">Search medicines, barcodes...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-xs shrink-0">
              Ctrl + K
            </kbd>
          </button>

          {/* Scan Barcode Image Action Button */}
          <button
            onClick={() => setIsBarcodeScanOpen(true)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900 dark:bg-slate-800/90 hover:bg-slate-800 dark:hover:bg-slate-700 text-teal-400 border border-teal-500/30 hover:border-teal-400 font-bold text-xs rounded-xl shadow-md hover:shadow-teal-900/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Read barcode / QR code from image photo to create bill"
          >
            <Barcode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            <span className="hidden xl:inline">Barcode Image</span>
          </button>

          {/* Scan Strip OCR Action Button */}
          <button
            onClick={() => setIsStripScanOpen(true)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-950/30 hover:shadow-teal-900/50 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Scan Medicine Foil / Blister Strip using AI OCR"
          >
            <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Strip OCR</span>
            <span className="px-1 py-0.2 bg-teal-900/90 text-teal-200 text-[9px] rounded font-mono font-black border border-teal-400/30">AI</span>
          </button>

          {/* Scanner USB status badge */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0" title="USB Barcode / QR Scanner Listener Ready">
            <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold font-mono text-slate-300">Scanner Ready</span>
          </div>
        </div>

        {/* Right: Alerts, Theme & User Profile */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md shadow-rose-900/50">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>System Alerts ({unreadAlerts.length})</span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No alerts right now. System optimal.</div>
                  ) : (
                    alerts.slice(0, 8).map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => markAlertRead(alert.id)}
                        className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${alert.status === 'unread' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`font-bold ${alert.severity === 'critical' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => updateSettings({ darkTheme: !settings.darkTheme })}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-700"
            title="Toggle Dark / Light Theme"
          >
            {settings.darkTheme ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Active Logged In User Menu */}
          <div className="relative border-l border-slate-200 dark:border-slate-800 pl-3 ml-1">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left border border-transparent hover:border-slate-700"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-950/30 uppercase border border-teal-400/20">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-teal-400" />
                  <span>{currentUser.role}</span>
                </div>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800">
                
                {/* User Info Header */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-md font-bold text-[10px] uppercase">
                      {currentUser.role}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                    </span>
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {currentUser.email}
                  </p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {currentUser.phone}
                    </p>
                  )}
                </div>

                {/* Quick Navigation / Settings */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('security');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <KeyRound className="w-4 h-4 text-teal-500" />
                    <span>Security & Staff Accounts</span>
                  </button>
                </div>

                {/* Log Out Action */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      addToast('Logged out successfully', 'info');
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Account</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
