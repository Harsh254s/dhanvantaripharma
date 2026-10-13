export type UserRole = 
  | 'Owner' 
  | 'Admin' 
  | 'Pharmacist' 
  | 'Cashier' 
  | 'Inventory Manager' 
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  password?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  manufacturer: string;
  category: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler' | 'Sachet' | 'Equipments';
  dosageForm: string;
  strength: string;
  composition: string;
  packSize: string; // e.g. "10 Tablets", "100ml Bottle"
  storageConditions: string; // e.g. "Below 25°C", "Refrigerated 2-8°C"
  gstPercentage: number; // 0, 5, 12, 18
  hsnCode: string;
  prescriptionRequired: boolean;
  scheduleType: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'Narcotic';
  barcode: string;
  qrCode?: string;
  description?: string;
  rackLocation: string; // e.g. "Rack A-02"
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  purchaseDate: string;
  purchasePrice: number; // Cost price per pack
  sellingPrice: number;  // Rate charged to customer before discount
  mrp: number;           // Maximum Retail Price
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  rackNumber: string;
  warehouse: string;
  status: 'Active' | 'Low' | 'Expired' | 'Quarantined' | 'Returned';
  remarks?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  pendingAmount: number;
  prescriptions?: string[]; // URLs or base64
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  gstNumber: string;
  drugLicense: string;
  phone: string;
  email: string;
  address: string;
  outstandingAmount: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  medicineId: string;
  batchId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  mrp: number;
  unitPrice: number; // Selling price
  gstPercentage: number;
  gstAmount: number;
  discountPercentage: number;
  discountAmount: number;
  total: number; // Final item total
}

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  items: SaleItem[];
  subtotal: number;
  totalGst: number;
  totalDiscount: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Split';
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  status: 'Paid' | 'Pending' | 'Returned' | 'Cancelled';
  billedBy: string;
  billedByName: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  purchaseRate: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  discountPercentage: number;
  hsnCode: string;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  supplierGst: string;
  invoiceDate: string;
  items: PurchaseItem[];
  subtotal: number;
  totalGst: number;
  totalDiscount: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  invoiceDocUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  type: 'Expiry' | 'LowStock' | 'OutofStock' | 'Audit' | 'Security';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  expiryDaysLeft?: number;
  medicineId?: string;
  batchId?: string;
  createdAt: string;
  status: 'unread' | 'read' | 'resolved';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemSettings {
  pharmacyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstNo: string;
  drugLicenseNo: string;
  fefoEnabled: boolean;
  autoQuarantineExpired: boolean;
  loyaltyEarnRate: number; // e.g. 1 point per 100 Rs
  loyaltyRedeemRate: number; // 1 point = 1 Rs
  receiptFooterMessage: string;
  darkTheme: boolean;
}

export interface OCRItemExtraction {
  medicineName: string;
  genericName?: string;
  manufacturer?: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  purchaseRate: number;
  sellingPrice: number;
  quantity: number;
  gstPercentage: number;
  hsnCode?: string;
  confidence: number; // 0 to 100
  matchedMedicineId?: string;
}

export interface OCRInvoiceResult {
  supplierName: string;
  supplierGst?: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: OCRItemExtraction[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  rawText?: string;
}

export interface MedicineStripScanResult {
  medicineName: string;
  genericName?: string;
  composition?: string;
  manufacturer?: string;
  brand?: string;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  mrp?: number;
  packSize?: string;
  scheduleType?: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'Narcotic';
  dosageForm?: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler' | 'Sachet' | 'Equipments';
  storageConditions?: string;
  barcode?: string;
  confidence: number;
  rawText?: string;
  matchedMedicineId?: string;
  matchedMedicineName?: string;
  matchedMedicine?: Medicine;
  matchedBatchId?: string;
  matchedBatch?: MedicineBatch;
  isExpired?: boolean;
  daysToExpiry?: number;
}
