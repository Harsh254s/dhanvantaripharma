import React, { useRef } from 'react';
import { SaleInvoice } from '../types';
import { usePharmacy } from '../context/PharmacyContext';
import { Printer, X, Check, ShieldCheck, HeartPulse } from 'lucide-react';

interface PrintInvoiceModalProps {
  invoice: SaleInvoice | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ invoice, onClose }) => {
  const { settings } = usePharmacy();
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        
        {/* Modal Top Actions */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">Tax Invoice Preview #{invoice.invoiceNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Paper View */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950 max-h-[75vh] overflow-y-auto">
          <div 
            ref={printRef}
            className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 font-sans max-w-2xl mx-auto printable-area"
          >
            {/* Pharmacy Header */}
            <div className="border-b-2 border-teal-800 pb-4 mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HeartPulse className="w-6 h-6 text-teal-700" />
                <h2 className="text-2xl font-black text-teal-900 tracking-tight uppercase">{settings.pharmacyName}</h2>
              </div>
              <p className="text-xs font-semibold text-slate-600">{settings.tagline}</p>
              <p className="text-[11px] text-slate-500 mt-1">{settings.address}</p>
              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-600 mt-1">
                <span>Ph: {settings.phone}</span>
                <span>GSTIN: <b>{settings.gstNo}</b></span>
                <span>DL No: <b>{settings.drugLicenseNo}</b></span>
              </div>
            </div>

            {/* Bill Info & Customer Meta */}
            <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-3 mb-4">
              <div>
                <p className="text-[11px] uppercase text-slate-400 font-bold">Billed To</p>
                <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
                {invoice.customerPhone && <p className="text-slate-600 font-mono">Mob: {invoice.customerPhone}</p>}
                {invoice.doctorName && <p className="text-slate-600 italic">Dr: {invoice.doctorName}</p>}
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-extrabold text-xs rounded uppercase tracking-wider">
                  TAX INVOICE
                </span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-1">{invoice.invoiceNo}</p>
                <p className="text-slate-500 font-mono text-[11px]">{new Date(invoice.createdAt).toLocaleString()}</p>
                <p className="text-slate-600 font-medium text-[11px]">Pay Mode: <b>{invoice.paymentMode}</b></p>
              </div>
            </div>

            {/* Item Table */}
            <table className="w-full text-xs text-left mb-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px] bg-slate-50">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-1">Medicine Name</th>
                  <th className="py-2 px-1 font-mono">Batch</th>
                  <th className="py-2 px-1 font-mono">Exp</th>
                  <th className="py-2 px-1 text-center">Qty</th>
                  <th className="py-2 px-1 text-right">MRP</th>
                  <th className="py-2 px-1 text-right">Rate</th>
                  <th className="py-2 px-1 text-right">GST%</th>
                  <th className="py-2 px-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="text-slate-800">
                    <td className="py-1.5 px-1 font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-1 font-semibold">
                      {item.medicineName}
                      <span className="block text-[10px] text-slate-500 font-normal">{item.genericName}</span>
                    </td>
                    <td className="py-1.5 px-1 font-mono text-[11px]">{item.batchNumber}</td>
                    <td className="py-1.5 px-1 font-mono text-[11px]">{item.expiryDate}</td>
                    <td className="py-1.5 px-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 px-1 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                    <td className="py-1.5 px-1 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-1.5 px-1 text-right font-mono">{item.gstPercentage}%</td>
                    <td className="py-1.5 px-1 text-right font-mono font-bold">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & GST Breakup */}
            <div className="flex justify-between items-start border-t-2 border-slate-800 pt-3 text-xs mb-4">
              <div className="w-1/2 pr-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">GST Summary</p>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-1 font-mono text-slate-700">
                  <div className="flex justify-between">
                    <span>CGST (6%):</span>
                    <span>₹{(invoice.totalGst / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (6%):</span>
                    <span>₹{(invoice.totalGst / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                    <span>Total Tax:</span>
                    <span>₹{invoice.totalGst.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="w-1/2 pl-4 space-y-1 text-right font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount Savings:</span>
                    <span>-₹{invoice.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax Included:</span>
                  <span>₹{invoice.totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-teal-900 border-t-2 border-slate-800 pt-2 mt-1">
                  <span>NET PAYABLE:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Terms & Signature */}
            <div className="border-t border-slate-200 pt-4 mt-6 text-[10px] text-slate-500 flex justify-between items-end">
              <div className="max-w-xs space-y-1">
                <p className="font-semibold text-slate-700">{settings.receiptFooterMessage}</p>
                <p>E.&O.E. • Subject to Local Jurisdiction</p>
              </div>
              <div className="text-center font-mono">
                <div className="h-8 border-b border-slate-300 w-32 mb-1"></div>
                <p className="font-bold text-slate-700">{invoice.billedByName}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400">Reg Pharmacist Signature</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
