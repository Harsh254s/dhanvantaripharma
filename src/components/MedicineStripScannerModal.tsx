import React, { useState, useRef, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { 
  Scan, Camera, Upload, X, Sparkles, CheckCircle2, AlertTriangle, 
  Pill, Tag, Calendar, DollarSign, Building2, ShoppingCart, 
  Plus, RefreshCw, FileText, ShieldAlert, Layers, ArrowRight, Edit3, Save
} from 'lucide-react';
import { MedicineStripScanResult } from '../types';

// Preset sample strips for instant testing without camera
const SAMPLE_STRIPS = [
  {
    name: 'Augmentin 625 Duo Strip',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    sampleText: 'AUGMENTIN 625 DUO Amoxycillin and Potassium Clavulanate Tablets IP. B.No. GSK-9921 Mfg. 03/2024 Exp. 02/2026 M.R.P. Rs.223.50 per 10 Tabs. Mfd. by GlaxoSmithKline Pharmaceuticals Ltd. Schedule H Prescription Drug.'
  },
  {
    name: 'Telma 40 AM Strip',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80',
    sampleText: 'TELMA 40 AM Telmisartan 40mg and Amlodipine 5mg Tablets IP. B.No. T40-KJ22 Mfg. 08/2023 Exp. 07/2025 MRP Rs.184.00 per 15 Tablets. Manufactured by Glenmark Pharmaceuticals Ltd. Store below 25°C.'
  },
  {
    name: 'Pan-D Capsule Foil',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    sampleText: 'PAN-D Pantoprazole Gastro-resistant and Domperidone Prolonged-release Capsules. B.No. PND-9921 Mfg. 01/2024 Exp. 12/2025 MRP Rs.199.00 per 15 Capsules. Mfd by Alkem Laboratories Ltd. Schedule H.'
  },
  {
    name: 'Dolo 650mg Blister',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
    sampleText: 'DOLO 650 Paracetamol Tablets IP 650mg. B.No. DL-650-882 Mfg. 05/2024 Exp. 04/2027 MRP Rs.32.00 per 15 Tablets. Micro Labs Limited. OTC Drug.'
  }
];

export const MedicineStripScannerModal: React.FC = () => {
  const { 
    isStripScanOpen, setIsStripScanOpen, scanMedicineStrip, 
    addToast, setActiveTab, medicines, batches, addMedicine, addBatch 
  } = usePharmacy();

  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'samples'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawTextSample, setRawTextSample] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<MedicineStripScanResult | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when camera mode selected
  useEffect(() => {
    if (isStripScanOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isStripScanOpen, activeMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setRawTextSample(null);
      stopCamera();
      handleScanImage(dataUrl, null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setSelectedImage(compressedDataUrl);
        setRawTextSample(null);
        handleScanImage(compressedDataUrl, null);
      };
      img.src = srcUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_STRIPS[0]) => {
    setSelectedImage(sample.image);
    setRawTextSample(sample.sampleText);
    handleScanImage(sample.image, sample.sampleText);
  };

  const handleScanImage = async (base64Img: string | null, textSample: string | null) => {
    if (!base64Img && !textSample) {
      addToast('Please select or upload a medicine strip image to scan', 'warning');
      return;
    }
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setIsEditingDetails(false);
    try {
      const result = await scanMedicineStrip(base64Img || undefined, textSample || undefined);
      setScanResult(result);
      addToast(`Medicine Strip Scanned: ${result.medicineName}`, 'success');
    } catch (err: any) {
      console.error('Strip scan failed:', err);
      let msg = err.message || 'Failed to extract legible details from medicine strip image';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch {}
      setScanError(msg);
      addToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFieldChange = (field: keyof MedicineStripScanResult, value: any) => {
    if (!scanResult) return;
    setScanResult(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // Recalculate expiry status if expiryDate was edited
      if (field === 'expiryDate' && typeof value === 'string') {
        const expDate = new Date(value);
        if (!isNaN(expDate.getTime())) {
          const now = new Date();
          updated.isExpired = expDate < now;
          updated.daysToExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      
      // Check if medicine matches existing inventory items when medicineName changes
      if (field === 'medicineName' && typeof value === 'string') {
        const match = medicines.find(m => m.name.toLowerCase().includes(value.toLowerCase().trim()));
        updated.matchedMedicine = match || undefined;
        updated.matchedMedicineId = match ? match.id : undefined;
      }

      return updated;
    });
  };

  const handleAddToInventory = async () => {
    if (!scanResult) return;
    try {
      let medId = scanResult.matchedMedicineId;
      if (!medId) {
        // Register new medicine
        const newMed = await addMedicine({
          name: scanResult.medicineName,
          genericName: scanResult.genericName || scanResult.composition || '',
          brand: scanResult.brand || scanResult.medicineName.split(' ')[0],
          manufacturer: scanResult.manufacturer || 'Pharma Ltd',
          category: scanResult.dosageForm || 'Tablet',
          dosageForm: scanResult.dosageForm || 'Tablet',
          strength: 'Standard',
          composition: scanResult.composition || scanResult.genericName || '',
          packSize: scanResult.packSize || '10 Strips',
          storageConditions: scanResult.storageConditions || 'Store below 25°C',
          gstPercentage: 12,
          hsnCode: '3004',
          prescriptionRequired: scanResult.scheduleType !== 'OTC',
          scheduleType: scanResult.scheduleType || 'OTC',
          barcode: scanResult.barcode || '890' + Math.floor(100000000 + Math.random() * 900000000),
          rackLocation: 'Rack A-01',
          minStockLevel: 20
        });
        medId = newMed.id;
      }

      // Add batch
      if (scanResult.batchNumber) {
        await addBatch({
          medicineId: medId,
          batchNumber: scanResult.batchNumber,
          mfgDate: scanResult.mfgDate || '2024-01-01',
          expiryDate: scanResult.expiryDate || '2026-12-31',
          purchaseDate: new Date().toISOString().split('T')[0],
          purchasePrice: Math.round((scanResult.mrp || 100) * 0.7),
          sellingPrice: Math.round((scanResult.mrp || 100) * 0.9),
          mrp: scanResult.mrp || 100,
          supplierId: 'sup-1',
          supplierName: 'Cipla Distributors',
          invoiceNumber: 'INV-OCR-' + Math.floor(1000 + Math.random() * 9000),
          initialQuantity: 100,
          currentQuantity: 100,
          rackNumber: 'Rack A-01',
          warehouse: 'Main Store',
          status: 'Active'
        });
      }

      addToast(`Added/Updated ${scanResult.medicineName} in Inventory Master`, 'success');
      setIsStripScanOpen(false);
      setActiveTab('medicines');
    } catch (err: any) {
      addToast('Failed to save scanned medicine to inventory', 'error');
    }
  };

  if (!isStripScanOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">AI Medicine Strip & Box OCR Scanner</h3>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> Vision Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Photograph any medicine foil, blister strip, box or bottle to extract name, batch, expiry, MRP & composition.</p>
            </div>
          </div>

          <button
            onClick={() => setIsStripScanOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 px-6 text-xs font-bold">
          <button
            onClick={() => setActiveMode('samples')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeMode === 'samples' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Preset Sample Strips</span>
          </button>

          <button
            onClick={() => setActiveMode('camera')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeMode === 'camera' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Webcam / Camera Capture</span>
          </button>

          <button
            onClick={() => setActiveMode('upload')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeMode === 'upload' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Strip Photo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Image Source / Camera / Samples */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            
            {activeMode === 'samples' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select a Sample Medicine Packaging:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_STRIPS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 h-28 relative overflow-hidden group ${
                        selectedImage === sample.image
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <img 
                        src={sample.image} 
                        alt={sample.name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" 
                      />
                      <span className="font-bold relative z-10 text-[11px] leading-tight">{sample.name}</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold relative z-10 flex items-center gap-1">
                        <Scan className="w-3 h-3" /> Click to OCR Scan
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMode === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-teal-500/50 aspect-4/3 flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-4 text-center text-xs text-rose-400 space-y-2">
                      <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
                      <p>{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover" 
                      />
                      {/* Viewfinder overlay */}
                      <div className="absolute inset-6 border-2 border-teal-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                          <div className="w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                        </div>
                        <span className="text-[10px] text-teal-300 font-bold text-center bg-slate-950/70 px-2 py-0.5 rounded-full mx-auto backdrop-blur-xs">
                          Position Strip / Box Here
                        </span>
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                          <div className="w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!cameraError && (
                  <button
                    onClick={captureCameraSnapshot}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Scan Strip</span>
                  </button>
                )}
              </div>
            )}

            {activeMode === 'upload' && (
              <div className="space-y-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center cursor-pointer transition-all space-y-3 group"
                >
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Click to upload medicine strip image</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP, or HEIC photo files</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Image Preview */}
            {selectedImage && (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-16/9 group shadow-sm">
                  <img src={selectedImage} alt="Strip preview" className="w-full h-full object-cover" />
                  
                  {/* Laser scan animation when processing */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-teal-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent absolute top-0 animate-bounce"></div>
                      <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-2" />
                      <span className="font-extrabold text-xs tracking-wider text-teal-300">Extracting Text & Batch Details...</span>
                      <span className="text-[10px] text-slate-300 mt-1">Analyzing medicine name, expiry, MRP & composition...</span>
                    </div>
                  )}
                </div>

                {!isScanning && (
                  <button
                    onClick={() => handleScanImage(selectedImage, rawTextSample)}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-200" />
                    <span>Scan This Image with Gemini Vision</span>
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Right Column: OCR Extraction Results */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            
            {isScanning ? (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="p-4 bg-teal-500/10 text-teal-500 rounded-2xl animate-pulse">
                  <Scan className="w-10 h-10 animate-spin" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Analyzing Packaging Features</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">Reading foil text, batch stamp, expiry date, brand name, and manufacturing credentials.</p>
                </div>
              </div>
            ) : scanError ? (
              <div className="h-full flex flex-col items-center justify-center p-6 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">Scan Recognition Issue</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-sm">{scanError}</p>
                </div>
                {selectedImage && (
                  <button
                    onClick={() => handleScanImage(selectedImage, rawTextSample)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Gemini Scan</span>
                  </button>
                )}
              </div>
            ) : scanResult ? (
              <div className="space-y-4 overflow-y-auto max-h-[58vh] pr-1">
                
                {/* Header with Edit Toggle Button */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Extracted OCR Details
                    </span>
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-extrabold text-[10px] rounded-md border border-teal-500/40 uppercase">
                      {scanResult.confidence}% Accuracy
                    </span>
                  </div>

                  <button
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs ${
                      isEditingDetails
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700'
                    }`}
                  >
                    {isEditingDetails ? (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Corrected Details</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </>
                    )}
                  </button>
                </div>

                {/* EDIT MODE FORM */}
                {isEditingDetails ? (
                  <div className="p-4 bg-slate-900 border border-teal-500/40 rounded-2xl space-y-3 text-xs text-white">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-extrabold text-teal-400 flex items-center gap-1.5 text-xs">
                        <Edit3 className="w-4 h-4" /> Correct AI-Fetched Values
                      </span>
                      <span className="text-[10px] text-slate-400">Edits automatically update billing & inventory</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Medicine Name / Brand</label>
                        <input
                          type="text"
                          value={scanResult.medicineName}
                          onChange={(e) => handleFieldChange('medicineName', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-teal-500 outline-none"
                          placeholder="e.g. Augmentin 625 Duo"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Generic / Composition</label>
                        <input
                          type="text"
                          value={scanResult.composition || scanResult.genericName || ''}
                          onChange={(e) => {
                            handleFieldChange('composition', e.target.value);
                            handleFieldChange('genericName', e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 outline-none"
                          placeholder="e.g. Amoxycillin & Potassium Clavulanate"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Batch Number</label>
                        <input
                          type="text"
                          value={scanResult.batchNumber}
                          onChange={(e) => handleFieldChange('batchNumber', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-teal-500 outline-none"
                          placeholder="e.g. GSK-9921"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry Date (YYYY-MM-DD or YYYY-MM)</label>
                        <input
                          type="text"
                          value={scanResult.expiryDate}
                          onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-teal-500 outline-none"
                          placeholder="e.g. 2026-12-31"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={scanResult.mrp || 0}
                          onChange={(e) => handleFieldChange('mrp', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Manufacturer</label>
                        <input
                          type="text"
                          value={scanResult.manufacturer}
                          onChange={(e) => handleFieldChange('manufacturer', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 outline-none"
                          placeholder="e.g. Cipla Ltd"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pack Size</label>
                        <input
                          type="text"
                          value={scanResult.packSize}
                          onChange={(e) => handleFieldChange('packSize', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-teal-500 outline-none"
                          placeholder="e.g. 10 Tablets"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Schedule Type</label>
                        <select
                          value={scanResult.scheduleType || 'OTC'}
                          onChange={(e) => handleFieldChange('scheduleType', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-teal-500 outline-none"
                        >
                          <option value="OTC">OTC (Over the Counter)</option>
                          <option value="Schedule H">Schedule H</option>
                          <option value="Schedule H1">Schedule H1</option>
                          <option value="Schedule X">Schedule X</option>
                          <option value="Narcotic">Narcotic</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setIsEditingDetails(false)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done Editing</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Main Product Header Card */}
                    <div className="p-4 bg-gradient-to-r from-teal-900/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-extrabold text-[10px] rounded-md border border-teal-500/40 uppercase">
                              {scanResult.confidence}% Accuracy
                            </span>
                            {scanResult.scheduleType && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-extrabold text-[10px] rounded-md border border-purple-500/40">
                                {scanResult.scheduleType}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-white mt-1 leading-tight">{scanResult.medicineName}</h3>
                          <p className="text-xs text-teal-300 font-medium">{scanResult.composition || scanResult.genericName || 'Standard Pharmaceutical Composition'}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Printed MRP</span>
                          <span className="text-xl font-black text-emerald-400 font-mono">₹{scanResult.mrp?.toFixed(2) || '150.00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Batch & Expiry Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      
                      {/* Batch Number */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-teal-600" /> Batch Number
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm block">
                          {scanResult.batchNumber}
                        </span>
                      </div>

                      {/* Expiry Date */}
                      <div className={`p-3 rounded-xl border space-y-1 ${
                        scanResult.isExpired 
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                          : (scanResult.daysToExpiry && scanResult.daysToExpiry <= 90)
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1 opacity-80">
                          <Calendar className="w-3 h-3" /> Expiry Date
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm block">
                            {scanResult.expiryDate}
                          </span>
                          {scanResult.isExpired ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-600 text-white rounded">EXPIRED</span>
                          ) : (
                            <span className="text-[10px] font-bold opacity-80">
                              {scanResult.daysToExpiry} days left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Manufacturer */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-purple-600" /> Manufacturer
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {scanResult.manufacturer}
                        </span>
                      </div>

                      {/* Pack Size & Storage */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" /> Pack Size & Storage
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {scanResult.packSize} • {scanResult.storageConditions}
                        </span>
                      </div>

                    </div>
                  </>
                )}

                {/* ERP Inventory Match Card */}
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  scanResult.matchedMedicine 
                    ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800' 
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {scanResult.matchedMedicine ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      {scanResult.matchedMedicine ? 'Matched Dhanvantari ERP Inventory Record' : 'New Medicine - Not Found in Active Inventory'}
                    </span>
                  </div>

                  {scanResult.matchedMedicine ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-teal-200 dark:border-teal-800/60">
                      <div>
                        <span className="text-slate-500 block">Existing Master Item:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{scanResult.matchedMedicine.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Assigned Rack Location:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{scanResult.matchedMedicine.rackLocation}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      This medicine strip is not currently present in your master database. You can click "Register in Inventory" below to auto-create it.
                    </p>
                  )}
                </div>

                {/* Raw Read Text Snippet */}
                {scanResult.rawText && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Extracted Packaging Raw Text:</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 line-clamp-2">{scanResult.rawText}</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="p-4 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-2xl">
                  <Pill className="w-10 h-10 text-teal-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {selectedImage ? 'Image Loaded & Ready to Scan' : 'Ready to Scan Medicine Packaging'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {selectedImage 
                      ? 'Click the button below to extract medicine name, batch number, expiry date, MRP, and composition using Gemini AI Vision.' 
                      : 'Select a preset sample strip, capture from your webcam, or upload an image file to extract details instantly.'}
                  </p>
                </div>
                {selectedImage && (
                  <button
                    onClick={() => handleScanImage(selectedImage, rawTextSample)}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 mt-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-200 animate-pulse" />
                    <span>Run Gemini AI OCR Scan</span>
                  </button>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setScanResult(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddToInventory}
                  disabled={!scanResult}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>Register in Inventory</span>
                </button>

                <button
                  onClick={() => {
                    if (scanResult) {
                      addToast(`Selected ${scanResult.medicineName} for POS billing`, 'success');
                      setIsStripScanOpen(false);
                      setActiveTab('billing');
                    }
                  }}
                  disabled={!scanResult}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Proceed to POS Billing [F2]</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
