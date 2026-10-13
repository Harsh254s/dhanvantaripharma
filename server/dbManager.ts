import { GoogleGenAI, Type } from "@google/genai";
import { 
  Medicine, MedicineBatch, Customer, Supplier, SaleInvoice, 
  PurchaseInvoice, AlertItem, AuditLog, SystemSettings, OCRInvoiceResult,
  MedicineStripScanResult
} from '../src/types';
import { 
  initialSettings, initialUsers, initialSuppliers, initialCustomers, 
  initialMedicines, initialBatches, initialSales, initialPurchases, 
  initialAlerts, initialAuditLogs 
} from './dataStore';

class PharmacyDB {
  public settings: SystemSettings = { ...initialSettings };
  public users = [ ...initialUsers ];
  public suppliers = [ ...initialSuppliers ];
  public customers = [ ...initialCustomers ];
  public medicines = [ ...initialMedicines ];
  public batches = [ ...initialBatches ];
  public sales = [ ...initialSales ];
  public purchases = [ ...initialPurchases ];
  public alerts = [ ...initialAlerts ];
  public auditLogs = [ ...initialAuditLogs ];

  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.initGemini();
    this.runExpiryEngine();
  }

  private initGemini() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Gemini API init error:", err);
      }
    }
  }

  public getGeminiClient(): GoogleGenAI {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    if (!this.aiClient) {
      throw new Error("GEMINI_API_KEY is missing or client failed to initialize.");
    }
    return this.aiClient;
  }

  // --- EXPIRY ENGINE ---
  public runExpiryEngine() {
    const today = new Date(); // 2026-07-31
    const todayStr = today.toISOString().split('T')[0];

    this.batches.forEach(b => {
      const expDate = new Date(b.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        b.status = 'Expired';
        if (this.settings.autoQuarantineExpired && b.warehouse !== 'Quarantine Section') {
          b.warehouse = 'Quarantine Section';
          b.rackNumber = 'Quarantine Bay Q-EX';
          b.status = 'Quarantined';
          
          // Log alert if not already logged
          const existingAlert = this.alerts.find(a => a.batchId === b.id && a.type === 'Expiry');
          if (!existingAlert) {
            const med = this.medicines.find(m => m.id === b.medicineId);
            this.alerts.unshift({
              id: 'alt-' + Date.now() + Math.random().toString(36).substr(2, 4),
              type: 'Expiry',
              title: 'Batch Auto-Quarantined',
              message: `${med?.name || 'Medicine'} Batch ${b.batchNumber} has expired and was auto-moved to Quarantine.`,
              severity: 'critical',
              expiryDaysLeft: diffDays,
              medicineId: b.medicineId,
              batchId: b.id,
              createdAt: new Date().toISOString(),
              status: 'unread'
            });
          }
        }
      }
    });
  }

  // --- FEFO BATCH SUGGESTION ---
  public getFEFOBatches(medicineId: string): MedicineBatch[] {
    return this.batches
      .filter(b => b.medicineId === medicineId && b.currentQuantity > 0 && b.status === 'Active')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  // --- SCANNER LOOKUP ---
  public scanBarcode(code: string) {
    const trimmed = code.trim();
    // 1. Check medicine barcode
    const medicine = this.medicines.find(m => m.barcode === trimmed);
    if (medicine) {
      const fefoBatches = this.getFEFOBatches(medicine.id);
      const allBatches = this.batches.filter(b => b.medicineId === medicine.id);
      return {
        type: 'MEDICINE',
        medicine,
        fefoSuggestedBatch: fefoBatches[0] || null,
        allBatches,
        warning: fefoBatches.length === 0 ? 'No active non-expired stock available for this medicine!' : null
      };
    }

    // 2. Check batch number direct scan
    const batch = this.batches.find(b => b.batchNumber.toLowerCase() === trimmed.toLowerCase());
    if (batch) {
      const med = this.medicines.find(m => m.id === batch.medicineId);
      const today = new Date();
      const expDate = new Date(batch.expiryDate);
      const isExpired = expDate < today;

      return {
        type: 'BATCH',
        medicine: med,
        fefoSuggestedBatch: batch,
        allBatches: this.batches.filter(b => b.medicineId === batch.medicineId),
        warning: isExpired ? `WARNING: Scanned batch ${batch.batchNumber} EXPIRED on ${batch.expiryDate}!` : 
                 batch.currentQuantity === 0 ? `WARNING: Batch ${batch.batchNumber} is OUT OF STOCK!` : null
      };
    }

    return null;
  }

  // --- RECORD SALE ---
  public recordSale(saleData: Omit<SaleInvoice, 'id' | 'invoiceNo' | 'createdAt'>): SaleInvoice {
    const invoiceNo = `DHN-${new Date().getFullYear()}-${String(this.sales.length + 101).padStart(4, '0')}`;
    const newSale: SaleInvoice = {
      ...saleData,
      id: 'sale-' + Date.now(),
      invoiceNo,
      createdAt: new Date().toISOString()
    };

    // Deduct batch quantities & update stock status
    newSale.items.forEach(item => {
      const batch = this.batches.find(b => b.id === item.batchId);
      if (batch) {
        batch.currentQuantity = Math.max(0, batch.currentQuantity - item.quantity);
        if (batch.currentQuantity === 0) {
          batch.status = 'Low';
        }
      }
    });

    // Update customer loyalty points & pending amount
    if (newSale.customerId) {
      const cust = this.customers.find(c => c.id === newSale.customerId);
      if (cust) {
        const earned = Math.floor(newSale.grandTotal / this.settings.loyaltyEarnRate);
        cust.loyaltyPoints += earned;
        if (newSale.status === 'Pending') {
          cust.pendingAmount += newSale.grandTotal;
        }
      }
    }

    this.sales.unshift(newSale);

    // Audit log
    this.addAuditLog({
      userId: newSale.billedBy,
      userName: newSale.billedByName,
      userRole: 'Pharmacist',
      action: 'Create Invoice',
      module: 'Billing Counter',
      details: `Generated Invoice #${invoiceNo} for ${newSale.customerName} (Grand Total: ₹${newSale.grandTotal.toFixed(2)})`
    });

    return newSale;
  }

  // --- RECORD PURCHASE ---
  public recordPurchase(purchaseData: Omit<PurchaseInvoice, 'id' | 'createdAt'>): PurchaseInvoice {
    const newPurchase: PurchaseInvoice = {
      ...purchaseData,
      id: 'pur-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    // Update or create batches
    newPurchase.items.forEach(item => {
      let existingBatch = this.batches.find(b => b.medicineId === item.medicineId && b.batchNumber === item.batchNumber);
      if (existingBatch) {
        existingBatch.currentQuantity += item.quantity;
        existingBatch.initialQuantity += item.quantity;
        existingBatch.purchasePrice = item.purchaseRate;
        existingBatch.sellingPrice = item.sellingPrice;
        existingBatch.mrp = item.mrp;
        existingBatch.expiryDate = item.expiryDate;
      } else {
        const med = this.medicines.find(m => m.id === item.medicineId);
        this.batches.push({
          id: 'batch-' + Date.now() + Math.random().toString(36).substr(2, 4),
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
          purchaseDate: purchaseData.invoiceDate,
          purchasePrice: item.purchaseRate,
          sellingPrice: item.sellingPrice,
          mrp: item.mrp,
          supplierId: purchaseData.supplierId,
          supplierName: purchaseData.supplierName,
          invoiceNumber: purchaseData.invoiceNo,
          initialQuantity: item.quantity,
          currentQuantity: item.quantity,
          rackNumber: med?.rackLocation || 'Rack Entry',
          warehouse: 'Main Store',
          status: 'Active'
        });
      }
    });

    // Update supplier outstanding amount
    const sup = this.suppliers.find(s => s.id === purchaseData.supplierId);
    if (sup) {
      sup.outstandingAmount += purchaseData.pendingAmount;
    }

    this.purchases.unshift(newPurchase);

    this.addAuditLog({
      userId: 'usr-admin',
      userName: purchaseData.createdBy,
      userRole: 'Inventory Manager',
      action: 'Record Purchase',
      module: 'Purchase Entry',
      details: `Recorded purchase invoice #${purchaseData.invoiceNo} from ${purchaseData.supplierName}`
    });

    return newPurchase;
  }

  // --- ADD AUDIT LOG ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      ...log,
      id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString()
    });
  }

  // --- AI OCR DISTRIBUTOR INVOICE EXTRACTION ---
  public async extractOCRInvoice(base64Data?: string, rawText?: string): Promise<OCRInvoiceResult> {
    const ai = this.getGeminiClient();

    const promptText = `You are an expert Indian Pharmacy ERP OCR and document parsing engine.
Analyze the following distributor bill / medicine purchase invoice or text.
Extract all structured data into a pristine JSON response.

Examine the invoice for:
1. Distributor / Supplier Name
2. Supplier GSTIN
3. Invoice Number
4. Invoice Date (YYYY-MM-DD)
5. Array of medicine items:
   - medicineName (Exact or brand name as printed)
   - genericName (Chemical/Generic composition if mentioned)
   - manufacturer (Pharma company)
   - batchNumber
   - mfgDate (YYYY-MM-DD)
   - expiryDate (YYYY-MM-DD)
   - mrp (Number)
   - purchaseRate (Cost price per pack)
   - sellingPrice (Estimated selling price, default mrp * 0.9 if not specified)
   - quantity (Integer packs/strips)
   - gstPercentage (5, 12, or 18)
   - hsnCode
   - confidence (0 to 100)

Return ONLY valid JSON with schema matching:
{
  "supplierName": string,
  "supplierGst": string,
  "invoiceNumber": string,
  "invoiceDate": string,
  "items": Array<{
    "medicineName": string,
    "genericName": string,
    "manufacturer": string,
    "batchNumber": string,
    "mfgDate": string,
    "expiryDate": string,
    "mrp": number,
    "purchaseRate": number,
    "sellingPrice": number,
    "quantity": number,
    "gstPercentage": number,
    "hsnCode": string,
    "confidence": number
  }>,
  "subtotal": number,
  "totalGst": number,
  "grandTotal": number
}`;

    let contentsParts: any[] = [];
    if (base64Data) {
      // Clean base64 prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: base64Data.includes('pdf') ? 'application/pdf' : 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    contentsParts.push({ text: rawText ? `Invoice Text Content:\n${rawText}\n\n${promptText}` : promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '{}';
    let result: OCRInvoiceResult;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini OCR JSON output:", responseText);
      throw new Error("Failed to extract structured OCR invoice from document.");
    }

    // Smart Medicine Matching against existing DB
    if (result.items && Array.isArray(result.items)) {
      result.items.forEach(item => {
        const matched = this.medicines.find(m => 
          m.name.toLowerCase().includes(item.medicineName.toLowerCase()) || 
          item.medicineName.toLowerCase().includes(m.name.toLowerCase()) ||
          (m.genericName && item.genericName && m.genericName.toLowerCase().includes(item.genericName.toLowerCase()))
        );
        if (matched) {
          item.matchedMedicineId = matched.id;
        }
      });
    }

    return result;
  }

  // --- AI MEDICINE STRIP / PACKAGING OCR SCANNER ---
  public async extractMedicineStripOCR(base64Data?: string, rawText?: string): Promise<MedicineStripScanResult> {
    const ai = this.getGeminiClient();

    const promptText = `You are an expert pharmaceutical vision & OCR AI model trained to read medicine foil strips, blister packs, syrup bottles, and medicine boxes in any orientation or lighting.
Examine the image or text of the medicine strip/packaging carefully. Note that silver metallic foil strips often have text printed vertically or sideways (e.g., "Dolo-500", "DOAS0379", "MFG.JAN.26", "EXP.DEC.25", "FOR 15 TABS", "Rs.15-12"). Read all printed text across all angles.

Extract all details printed on the strip into a JSON structure.

Look for:
1. medicineName (Full brand or trade name, e.g. "Dolo-500", "Augmentin 625 Duo", "Telma 40 AM", "Pan-D", "Calpol 650")
2. genericName / composition (e.g. "Paracetamol Tablets IP 500mg", "Amoxycillin & Potassium Clavulanate")
3. manufacturer (Pharma company, e.g. "Micro Labs", "GlaxoSmithKline", "Cipla Ltd", "Glenmark")
4. brand (Brand name)
5. batchNumber (e.g. "DOAS0379", "GSK-9921", "T40-KJ22")
6. mfgDate (Format YYYY-MM-DD or YYYY-MM, e.g. "MFG.JAN.26" -> "2026-01-01" or "2024-01-01")
7. expiryDate (Format YYYY-MM-DD or YYYY-MM, e.g. "EXP.DEC.25" -> "2025-12-31")
8. mrp (Number in INR e.g. 15.12 for "Rs.15-12")
9. packSize (e.g. "15 Tablets", "10 Tablets", "10 Capsules")
10. scheduleType ('OTC', 'Schedule H', 'Schedule H1', 'Schedule X', 'Narcotic')
11. dosageForm ('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Sachet', 'Equipments')
12. storageConditions (e.g. "Store below 30°C")
13. barcode (barcode/QR text if visible)
14. confidence (Integer 0 to 100 based on legibility)
15. rawText (All readable text printed on the strip verbatim)

Return ONLY valid JSON matching this schema:
{
  "medicineName": string,
  "genericName": string,
  "composition": string,
  "manufacturer": string,
  "brand": string,
  "batchNumber": string,
  "mfgDate": string,
  "expiryDate": string,
  "mrp": number,
  "packSize": string,
  "scheduleType": "OTC" | "Schedule H" | "Schedule H1" | "Schedule X" | "Narcotic",
  "dosageForm": "Tablet" | "Capsule" | "Syrup" | "Injection" | "Ointment" | "Drops" | "Inhaler" | "Sachet" | "Equipments",
  "storageConditions": string,
  "barcode": string,
  "confidence": number,
  "rawText": string
}`;

    let contentsParts: any[] = [];
    if (base64Data && base64Data.trim()) {
      let mimeType = 'image/jpeg';
      let cleanBase64 = '';

      if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
        // Fetch remote URL and convert to base64
        try {
          const fetchRes = await fetch(base64Data);
          const arrayBuffer = await fetchRes.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
          mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
        } catch (e) {
          console.error("Failed to fetch remote sample image for OCR:", e);
        }
      } else if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:([^;]+);base64,(.*)$/s);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        } else {
          cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
        }
      } else {
        cleanBase64 = base64Data;
      }

      if (cleanBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      }
    }

    contentsParts.push({ text: rawText ? `Strip Text Content:\n${rawText}\n\n${promptText}` : promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '{}';
    let scanData: Partial<MedicineStripScanResult> = {};
    try {
      scanData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini Strip OCR output:", responseText);
      throw new Error("Could not extract legible medicine details from the strip scan.");
    }

    // Match extracted medicine name / generic / batch with DB
    let matchedMed = this.medicines.find(m => 
      (scanData.medicineName && m.name.toLowerCase().includes(scanData.medicineName.toLowerCase())) ||
      (scanData.medicineName && scanData.medicineName.toLowerCase().includes(m.name.toLowerCase())) ||
      (m.barcode && scanData.barcode && m.barcode === scanData.barcode)
    );

    let matchedBatch: MedicineBatch | undefined;
    if (scanData.batchNumber) {
      matchedBatch = this.batches.find(b => 
        b.batchNumber.toLowerCase() === scanData.batchNumber!.toLowerCase()
      );
      if (matchedBatch && !matchedMed) {
        matchedMed = this.medicines.find(m => m.id === matchedBatch!.medicineId);
      }
    } else if (matchedMed) {
      // Find earliest active batch (FEFO)
      const fefo = this.getFEFOBatches(matchedMed.id);
      matchedBatch = fefo[0];
    }

    // Expiry check
    let isExpired = false;
    let daysToExpiry: number | undefined;
    if (scanData.expiryDate || matchedBatch?.expiryDate) {
      const targetExp = scanData.expiryDate || matchedBatch?.expiryDate;
      if (targetExp) {
        const exp = new Date(targetExp);
        const today = new Date();
        const diffMs = exp.getTime() - today.getTime();
        daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isExpired = daysToExpiry < 0;
      }
    }

    const finalResult: MedicineStripScanResult = {
      medicineName: scanData.medicineName || matchedMed?.name || 'Unknown Medicine Strip',
      genericName: scanData.genericName || matchedMed?.genericName || '',
      composition: scanData.composition || matchedMed?.composition || scanData.genericName || '',
      manufacturer: scanData.manufacturer || matchedMed?.manufacturer || 'Pharma Co.',
      brand: scanData.brand || matchedMed?.brand || '',
      batchNumber: scanData.batchNumber || matchedBatch?.batchNumber || 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
      mfgDate: scanData.mfgDate || matchedBatch?.mfgDate || '2024-01-01',
      expiryDate: scanData.expiryDate || matchedBatch?.expiryDate || '2026-12-31',
      mrp: scanData.mrp || matchedBatch?.mrp || 150,
      packSize: scanData.packSize || matchedMed?.packSize || '10 Strips',
      scheduleType: scanData.scheduleType || matchedMed?.scheduleType || 'OTC',
      dosageForm: scanData.dosageForm || matchedMed?.category || 'Tablet',
      storageConditions: scanData.storageConditions || matchedMed?.storageConditions || 'Store below 25°C',
      barcode: scanData.barcode || matchedMed?.barcode || '',
      confidence: scanData.confidence || 92,
      rawText: scanData.rawText || '',
      matchedMedicineId: matchedMed?.id,
      matchedMedicineName: matchedMed?.name,
      matchedMedicine: matchedMed,
      matchedBatchId: matchedBatch?.id,
      matchedBatch: matchedBatch,
      isExpired,
      daysToExpiry
    };

    return finalResult;
  }

  // AI Barcode & QR Code Reader from uploaded image
  public async extractBarcodeFromImage(base64Data?: string, rawText?: string) {
    const ai = this.getGeminiClient();

    const promptText = `Analyze this image specifically to read and decode any 1D/2D Barcode, EAN-13, UPC, Code 128, GS1 DataMatrix, or QR code visible on the product packaging, medicine box, or label.

Extract the exact text/numbers contained in the barcode/QR code, as well as any clearly printed batch number, product name, expiry date, and MRP.

Return ONLY valid JSON matching this schema:
{
  "detectedBarcode": string,
  "barcodeType": string,
  "confidence": number,
  "extractedDetails": {
    "medicineName": string,
    "genericName": string,
    "batchNumber": string,
    "expiryDate": string,
    "mrp": number,
    "manufacturer": string
  },
  "rawText": string
}`;

    let contentsParts: any[] = [];
    if (base64Data && base64Data.trim()) {
      let mimeType = 'image/jpeg';
      let cleanBase64 = '';

      if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:([^;]+);base64,(.*)$/s);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        } else {
          cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
        }
      } else {
        cleanBase64 = base64Data;
      }

      if (cleanBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      }
    }

    contentsParts.push({ text: rawText ? `Barcode Image Content:\n${rawText}\n\n${promptText}` : promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '{}';
    let scanData: any = {};
    try {
      scanData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini Barcode Image output:", responseText);
      throw new Error("Could not decode barcode from image.");
    }

    const code = scanData.detectedBarcode || scanData.extractedDetails?.batchNumber || scanData.extractedDetails?.medicineName || '';

    let matchedResult = this.scanBarcode(code);
    if (!matchedResult && scanData.extractedDetails?.medicineName) {
      const medName = scanData.extractedDetails.medicineName.toLowerCase();
      const med = this.medicines.find(m => m.name.toLowerCase().includes(medName) || medName.includes(m.name.toLowerCase()));
      if (med) {
        const fefoBatches = this.getFEFOBatches(med.id);
        const allBatches = this.batches.filter(b => b.medicineId === med.id);
        matchedResult = {
          type: 'MEDICINE',
          medicine: med,
          fefoSuggestedBatch: fefoBatches[0] || null,
          allBatches,
          warning: fefoBatches.length === 0 ? 'No active non-expired stock available!' : null
        };
      }
    }

    return {
      detectedBarcode: code || 'UNKNOWN',
      barcodeType: scanData.barcodeType || '1D/2D Barcode',
      confidence: scanData.confidence || 95,
      extractedDetails: scanData.extractedDetails || {},
      rawText: scanData.rawText || '',
      scanResult: matchedResult,
      foundInDb: !!matchedResult
    };
  }

  // --- SMART MEDICINE RECOGNITION (FUZZY MATCH) ---
  public async smartMatchMedicine(inputName: string) {
    const ai = this.getGeminiClient();
    const existingList = this.medicines.map(m => ({ id: m.id, name: m.name, generic: m.genericName, brand: m.brand }));

    const prompt = `You are a Pharmacy ERP Smart Medicine Matching assistant.
Target input medicine query: "${inputName}"

Here is the list of existing medicines in Dhanvantari Pharmacy database:
${JSON.stringify(existingList, null, 2)}

Identify if this target query maps to any existing medicine in the list despite typos or formatting differences (e.g. "PANTOCID-40" vs "Pantocid 40 Tablet").
Return JSON format:
{
  "matched": boolean,
  "medicineId": string or null,
  "medicineName": string or null,
  "confidence": number (0-100),
  "suggestedCorrectedName": string,
  "reasoning": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  }

  // --- AI ANALYTICS & EXPIRED DEMAND FORECASTING ---
  public async getAIPredictiveAnalytics() {
    const ai = this.getGeminiClient();
    const inventorySummary = this.medicines.map(m => {
      const medBatches = this.batches.filter(b => b.medicineId === m.id);
      const totalStock = medBatches.reduce((acc, b) => acc + b.currentQuantity, 0);
      return {
        id: m.id,
        name: m.name,
        category: m.category,
        totalStock,
        minStockLevel: m.minStockLevel,
        expiringSoonCount: medBatches.filter(b => {
          const diffDays = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          return diffDays >= 0 && diffDays <= 90;
        }).reduce((acc, b) => acc + b.currentQuantity, 0)
      };
    });

    const prompt = `Analyze this Dhanvantari Pharmacy ERP inventory snapshot:
${JSON.stringify(inventorySummary, null, 2)}

Provide executive AI Insights & Demand Predictions for the pharmacy manager in JSON format:
{
  "reorderRecommendations": Array<{ "medicineName": string, "reason": string, "recommendedQty": number }>,
  "expiryRiskAnalysis": string,
  "fastMovingTrends": Array<string>,
  "deadStockWarning": Array<string>,
  "revenueGrowthAdvice": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

export const db = new PharmacyDB();
