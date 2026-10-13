import { 
  User, Medicine, MedicineBatch, Customer, Supplier, SaleInvoice, 
  PurchaseInvoice, AlertItem, AuditLog, SystemSettings 
} from '../src/types';

export const initialSettings: SystemSettings = {
  pharmacyName: "Dhanvantari Pharmacy",
  tagline: "Your Trusted Quality Healthcare Partner",
  address: "Shop #12-14, Dhanvantari Medical Complex, Station Road, City Center, PIN-400001",
  phone: "+91 98765 43210",
  email: "care@dhanvantaripharmacy.com",
  gstNo: "27AABCD1234E1Z5",
  drugLicenseNo: "20B-MH-458921 / 21B-MH-458922",
  fefoEnabled: true,
  autoQuarantineExpired: true,
  loyaltyEarnRate: 100, // 1 point per 100 Rs
  loyaltyRedeemRate: 1,  // 1 point = 1 Rs
  receiptFooterMessage: "Get well soon! Medicines once sold can only be returned with valid bill within 7 days in original condition.",
  darkTheme: false,
};

export const initialUsers: User[] = [
  { id: 'usr-1', name: 'Dr. Rajesh Sharma', email: 'owner@dhanvantari.com', role: 'Owner', phone: '9876543210', active: true, createdAt: '2025-01-01T08:00:00Z' },
  { id: 'usr-2', name: 'Ananya Verma', email: 'admin@dhanvantari.com', role: 'Admin', phone: '9876543211', active: true, createdAt: '2025-01-02T08:00:00Z' },
  { id: 'usr-3', name: 'Suresh Patel (Reg Pharmacist)', email: 'pharmacist@dhanvantari.com', role: 'Pharmacist', phone: '9876543212', active: true, createdAt: '2025-01-05T08:00:00Z' },
  { id: 'usr-4', name: 'Rohan Gupta', email: 'cashier@dhanvantari.com', role: 'Cashier', phone: '9876543213', active: true, createdAt: '2025-01-10T08:00:00Z' },
  { id: 'usr-5', name: 'Vikas Singh', email: 'inventory@dhanvantari.com', role: 'Inventory Manager', phone: '9876543214', active: true, createdAt: '2025-01-12T08:00:00Z' },
];

export const initialSuppliers: Supplier[] = [];
export const initialCustomers: Customer[] = [];
export const initialMedicines: Medicine[] = [];
export const initialBatches: MedicineBatch[] = [];
export const initialSales: SaleInvoice[] = [];
export const initialPurchases: PurchaseInvoice[] = [];
export const initialAlerts: AlertItem[] = [];
export const initialAuditLogs: AuditLog[] = [];
