import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/dbManager";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API ROUTES ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", pharmacy: db.settings.pharmacyName, timestamp: new Date().toISOString() });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    res.json(db.settings);
  });
  app.post("/api/settings", (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    db.addAuditLog({
      userId: 'usr-admin',
      userName: 'Administrator',
      userRole: 'Admin',
      action: 'Update Settings',
      module: 'System Settings',
      details: 'Updated Pharmacy Profile & System Parameters'
    });
    res.json(db.settings);
  });

  // Users & Auth
  app.get("/api/users", (req, res) => {
    res.json(db.users);
  });

  // Medicines
  app.get("/api/medicines", (req, res) => {
    db.runExpiryEngine();
    res.json(db.medicines);
  });
  app.post("/api/medicines", (req, res) => {
    const newMed = {
      ...req.body,
      id: 'med-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.medicines.unshift(newMed);
    db.addAuditLog({
      userId: 'usr-pharmacist',
      userName: 'Pharmacist',
      userRole: 'Pharmacist',
      action: 'Add Medicine',
      module: 'Medicine Master',
      details: `Added new medicine ${newMed.name} (${newMed.category})`
    });
    res.json(newMed);
  });
  app.put("/api/medicines/:id", (req, res) => {
    const idx = db.medicines.findIndex(m => m.id === req.params.id);
    if (idx !== -1) {
      db.medicines[idx] = { ...db.medicines[idx], ...req.body, updatedAt: new Date().toISOString() };
      res.json(db.medicines[idx]);
    } else {
      res.status(404).json({ error: "Medicine not found" });
    }
  });

  // Batches
  app.get("/api/batches", (req, res) => {
    db.runExpiryEngine();
    res.json(db.batches);
  });
  app.post("/api/batches", (req, res) => {
    const newBatch = {
      ...req.body,
      id: 'batch-' + Date.now(),
      status: 'Active'
    };
    db.batches.unshift(newBatch);
    res.json(newBatch);
  });

  // Scanner endpoint (Barcode / Batch number)
  app.get("/api/scan/:code", (req, res) => {
    const scanResult = db.scanBarcode(req.params.code);
    if (scanResult) {
      res.json(scanResult);
    } else {
      res.status(404).json({ error: "Unknown Barcode or Batch Number. Register new item?" });
    }
  });

  // Billing
  app.post("/api/billing/sale", (req, res) => {
    try {
      const sale = db.recordSale(req.body);
      res.json(sale);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to record sale" });
    }
  });
  app.get("/api/sales", (req, res) => {
    res.json(db.sales);
  });

  // Purchases
  app.post("/api/purchases", (req, res) => {
    try {
      const purchase = db.recordPurchase(req.body);
      res.json(purchase);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to record purchase" });
    }
  });
  app.get("/api/purchases", (req, res) => {
    res.json(db.purchases);
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    res.json(db.customers);
  });
  app.post("/api/customers", (req, res) => {
    const newCust = {
      ...req.body,
      id: 'cust-' + Date.now(),
      loyaltyPoints: req.body.loyaltyPoints || 0,
      pendingAmount: req.body.pendingAmount || 0,
      createdAt: new Date().toISOString()
    };
    db.customers.unshift(newCust);
    res.json(newCust);
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    res.json(db.suppliers);
  });
  app.post("/api/suppliers", (req, res) => {
    const newSup = {
      ...req.body,
      id: 'sup-' + Date.now(),
      outstandingAmount: req.body.outstandingAmount || 0,
      createdAt: new Date().toISOString()
    };
    db.suppliers.unshift(newSup);
    res.json(newSup);
  });

  // Expiry Alerts
  app.get("/api/expiry/alerts", (req, res) => {
    db.runExpiryEngine();
    res.json(db.alerts);
  });

  // AI OCR Invoice Processing
  app.post("/api/ocr/extract", async (req, res) => {
    try {
      const { base64Data, rawText } = req.body;
      const result = await db.extractOCRInvoice(base64Data, rawText);
      res.json(result);
    } catch (err: any) {
      console.error("OCR Extraction Error:", err);
      res.status(500).json({ error: err.message || "AI OCR processing failed" });
    }
  });

  // AI OCR Medicine Strip & Packaging Scanner
  app.post("/api/ocr/scan-strip", async (req, res) => {
    try {
      const { base64Data, rawText } = req.body;
      const result = await db.extractMedicineStripOCR(base64Data, rawText);
      res.json(result);
    } catch (err: any) {
      console.error("Medicine Strip OCR Error:", err);
      res.status(500).json({ error: err.message || "Medicine Strip OCR scanning failed" });
    }
  });

  // AI Barcode Image Reader
  app.post("/api/ocr/scan-barcode-image", async (req, res) => {
    try {
      const { base64Data, rawText } = req.body;
      const result = await db.extractBarcodeFromImage(base64Data, rawText);
      res.json(result);
    } catch (err: any) {
      console.error("Barcode Image Scan Error:", err);
      res.status(500).json({ error: err.message || "Barcode image scanning failed" });
    }
  });

  // AI Smart Fuzzy Match
  app.post("/api/ai/match-medicine", async (req, res) => {
    try {
      const { name } = req.body;
      const result = await db.smartMatchMedicine(name);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Fuzzy match failed" });
    }
  });

  // AI Analytics & Demand Forecasting
  app.get("/api/ai/analytics", async (req, res) => {
    try {
      const analytics = await db.getAIPredictiveAnalytics();
      res.json(analytics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI Analytics failed" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", (req, res) => {
    res.json(db.auditLogs);
  });

  // Backup & Restore
  app.get("/api/backup/export", (req, res) => {
    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      pharmacy: db.settings,
      medicines: db.medicines,
      batches: db.batches,
      suppliers: db.suppliers,
      customers: db.customers,
      sales: db.sales,
      purchases: db.purchases,
      auditLogs: db.auditLogs
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=Dhanvantari_Backup.json');
    res.json(backupData);
  });

  app.post("/api/backup/import", (req, res) => {
    try {
      const data = req.body;
      if (data.medicines) db.medicines = data.medicines;
      if (data.batches) db.batches = data.batches;
      if (data.suppliers) db.suppliers = data.suppliers;
      if (data.customers) db.customers = data.customers;
      if (data.sales) db.sales = data.sales;
      if (data.purchases) db.purchases = data.purchases;
      if (data.pharmacy) db.settings = data.pharmacy;
      
      db.addAuditLog({
        userId: 'usr-owner',
        userName: 'Owner',
        userRole: 'Owner',
        action: 'Restore Backup',
        module: 'Database Backup',
        details: 'Successfully restored system database from backup file.'
      });

      res.json({ success: true, message: "Database restored successfully!" });
    } catch (err: any) {
      res.status(400).json({ error: "Invalid backup format." });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dhanvantari Pharmacy ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
