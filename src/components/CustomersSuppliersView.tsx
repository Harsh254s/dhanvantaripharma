import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Users, Truck, Plus, Phone, Mail, Award, CreditCard, Search } from 'lucide-react';

export const CustomersSuppliersView: React.FC = () => {
  const { customers, suppliers, addCustomer, addSupplier, addToast } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');

  const [showCustModal, setShowCustModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);

  const [custForm, setCustForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [supForm, setSupForm] = useState({ name: '', contactPerson: '', phone: '', email: '', gstNumber: '', drugLicenseNo: '', address: '' });

  const handleSaveCust = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomer(custForm);
    setShowCustModal(false);
    setCustForm({ name: '', phone: '', email: '', address: '' });
  };

  const handleSaveSup = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier({ ...supForm, pendingAmount: 0 });
    setShowSupModal(false);
    setSupForm({ name: '', contactPerson: '', phone: '', email: '', gstNumber: '', drugLicenseNo: '', address: '' });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Switcher & Action */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'customers' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers Directory ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'suppliers' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Suppliers Directory ({suppliers.length})</span>
          </button>
        </div>

        {activeTab === 'customers' ? (
          <button
            onClick={() => setShowCustModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSupModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}

      </div>

      {/* Directory Content Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        {activeTab === 'customers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 font-mono">Mobile Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Loyalty Points</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{c.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{c.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold text-[11px] rounded">
                        {c.loyaltyPoints} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">₹{c.pendingAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{c.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supplier Firm Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4 font-mono">Mobile</th>
                  <th className="py-3 px-4 font-mono">GSTIN</th>
                  <th className="py-3 px-4 font-mono">Drug License</th>
                  <th className="py-3 px-4 text-right">Pending Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{s.phone}</td>
                    <td className="py-3 px-4 font-mono text-teal-700 dark:text-teal-300">{s.gstNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.drugLicenseNo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{s.pendingAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add Customer Modal */}
      {showCustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-extrabold text-sm">Add New Customer</h3>
            <form onSubmit={handleSaveCust} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={custForm.phone}
                  onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  value={custForm.email}
                  onChange={e => setCustForm({ ...custForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCustModal(false)} className="px-3 py-1.5 bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-extrabold text-sm">Add New Distributor / Supplier</h3>
            <form onSubmit={handleSaveSup} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Firm Name *</label>
                <input
                  type="text"
                  required
                  value={supForm.name}
                  onChange={e => setSupForm({ ...supForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={supForm.contactPerson}
                  onChange={e => setSupForm({ ...supForm, contactPerson: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  value={supForm.phone}
                  onChange={e => setSupForm({ ...supForm, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={supForm.gstNumber}
                  onChange={e => setSupForm({ ...supForm, gstNumber: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSupModal(false)} className="px-3 py-1.5 bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
