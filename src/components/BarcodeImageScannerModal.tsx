import React, { useState, useRef, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { 
  Barcode, Camera, Upload, X, Sparkles, CheckCircle2, AlertTriangle, 
  Pill, Tag, Calendar, DollarSign, ShoppingCart, Plus, RefreshCw, 
  ArrowRight, ShieldCheck, QrCode, Image as ImageIcon, ScanLine, Layers
} from 'lucide-react';

// Preset Barcode & QR Code sample images for quick testing
const SAMPLE_BARCODES = [
  {
    name: 'Dolo 650mg EAN-13 Barcode',
    code: '8901234567890',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    desc: 'EAN-13 Retail Barcode for Dolo 650 Tablet'
  },
  {
    name: 'Augmentin 625 Duo Batch Barcode',
    code: 'DOL0650-B90',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    desc: 'Batch Barcode GSK-9921 for Augmentin 625'
  },
  {
    name: 'Telma 40 AM GS1 DataMatrix QR',
    code: 'T40-KJ22',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80',
    desc: '2D DataMatrix QR Code on Glenmark Telma 40 Box'
  },
  {
    name: 'Pantocid 40 Code-128 Barcode',
    code: '8901086002102',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
    desc: 'Cipla Pantocid 40 Strip Barcode'
  }
];

export const BarcodeImageScannerModal: React.FC = () => {
  const { 
    isBarcodeScanOpen, setIsBarcodeScanOpen, scanBarcodeImage, 
    setScannedCode, addToast, setActiveTab, medicines, batches 
  } = usePharmacy();

  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'samples'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [billQuantity, setBillQuantity] = useState<number>(1);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when camera mode selected
  useEffect(() => {
    if (isBarcodeScanOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isBarcodeScanOpen, activeMode]);

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
      setCameraError('Unable to access device camera. Please upload an image file or choose a sample.');
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setSelectedImage(dataUrl);
      stopCamera();
      handleProcessImage(dataUrl);
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
        handleProcessImage(compressedDataUrl);
      };
      img.src = srcUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_BARCODES[0]) => {
    setSelectedImage(sample.image);
    handleProcessImage(sample.image, sample.code);
  };

  const handleProcessImage = async (base64Img: string, sampleCode?: string) => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const result = await scanBarcodeImage(base64Img, sampleCode ? `Sample Barcode Code: ${sampleCode}` : undefined);
      setScanResult(result);
      if (result.detectedBarcode) {
        addToast(`Decoded Barcode: ${result.detectedBarcode}`, 'success');
      }
    } catch (err: any) {
      console.error('Barcode scan failed:', err);
      const msg = err.message || 'Could not decode barcode from image';
      setScanError(msg);
      addToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Direct Billing Action
  const handleAddToBill = () => {
    if (!scanResult) return;
    const barcodeToUse = scanResult.detectedBarcode || scanResult.scanResult?.medicine?.barcode;

    if (!barcodeToUse) {
      addToast('No valid barcode detected in image to populate bill.', 'warning');
      return;
    }

    // Set global scanned barcode and switch tab to Billing
    setScannedCode(barcodeToUse);
    setIsBarcodeScanOpen(false);
    setActiveTab('billing');
    addToast(`Added ${scanResult.scanResult?.medicine?.name || barcodeToUse} to Billing counter`, 'success');
  };

  if (!isBarcodeScanOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Barcode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">AI Barcode & QR Image Scanner</h3>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> Vision Reader
                </span>
              </div>
              <p className="text-xs text-slate-400">Upload any product photo, box barcode, 2D QR matrix, or EAN image to lookup stock & create bills immediately.</p>
            </div>
          </div>

          <button
            onClick={() => setIsBarcodeScanOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Input Mode Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveMode('upload'); stopCamera(); }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeMode === 'upload' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image File</span>
            </button>

            <button
              onClick={() => setActiveMode('camera')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeMode === 'camera' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Webcam</span>
            </button>

            <button
              onClick={() => { setActiveMode('samples'); stopCamera(); }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeMode === 'samples' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Sample Barcodes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Image Source / Preview */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative min-h-[260px] bg-slate-950 border-2 border-dashed border-slate-800 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center overflow-hidden p-3 group">
                
                {activeMode === 'upload' && !selectedImage && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer text-center space-y-3 p-6 hover:scale-105 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20 shadow-inner">
                      <Barcode className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Click or Drag Barcode Photo</p>
                      <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WebP up to 15MB</p>
                    </div>
                    <span className="inline-block px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs">
                      Browse Files
                    </span>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </div>
                )}

                {activeMode === 'camera' && (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                    {cameraError ? (
                      <div className="p-4 text-center text-rose-400 text-xs space-y-2">
                        <AlertTriangle className="w-6 h-6 mx-auto" />
                        <p>{cameraError}</p>
                      </div>
                    ) : (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-48 object-cover rounded-xl border border-slate-800"
                        />
                        <button
                          onClick={captureCameraSnapshot}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Barcode Photo</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {selectedImage && activeMode !== 'camera' && (
                  <div className="relative w-full h-full min-h-[240px] flex items-center justify-center">
                    <img 
                      src={selectedImage} 
                      alt="Uploaded Barcode" 
                      className="max-h-60 w-auto object-contain rounded-xl shadow-md" 
                    />
                    
                    {/* Scanning Beam Animation */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-teal-500/10 border-2 border-teal-500/50 rounded-xl overflow-hidden flex items-center justify-center">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-bounce"></div>
                      </div>
                    )}

                    <button
                      onClick={() => { setSelectedImage(null); setScanResult(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-lg hover:bg-rose-600 transition-colors"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Barcodes List */}
              {activeMode === 'samples' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Click Sample Barcode for Instant Test
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_BARCODES.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(s)}
                        className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:border-teal-500 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all text-xs space-y-1"
                      >
                        <p className="font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">{s.code}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Scan Results & Direct Billing Action */}
            <div className="md:col-span-7 space-y-4">
              
              {isScanning ? (
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Decoding Barcode via AI Vision...</h4>
                    <p className="text-xs text-slate-500 mt-1">Reading 1D/2D lines, EAN numbers, and matching pharmacy stock...</p>
                  </div>
                </div>
              ) : scanResult ? (
                <div className="space-y-4">
                  
                  {/* Barcode Extraction Card */}
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                          Barcode Decoded Successfully
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-600 text-white font-mono font-bold text-[10px] rounded-md">
                        {scanResult.barcodeType || 'EAN Barcode'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Scanned Code / EAN</span>
                        <span className="font-mono font-black text-base text-teal-700 dark:text-teal-300">
                          {scanResult.detectedBarcode}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Read Confidence</span>
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> {scanResult.confidence}% AI Accuracy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Match Details */}
                  {scanResult.scanResult ? (
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase rounded-md border border-emerald-300 dark:border-emerald-800">
                          Match Found in Inventory
                        </span>
                        {scanResult.scanResult.fefoSuggestedBatch && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                            FEFO Suggested Batch: {scanResult.scanResult.fefoSuggestedBatch.batchNumber}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {scanResult.scanResult.medicine?.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {scanResult.scanResult.medicine?.genericName} • {scanResult.scanResult.medicine?.manufacturer}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">MRP</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{scanResult.scanResult.fefoSuggestedBatch?.mrp || scanResult.scanResult.medicine?.mrp || '—'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Selling Price</span>
                          <span className="font-black text-teal-600 dark:text-teal-400">
                            ₹{scanResult.scanResult.fefoSuggestedBatch?.sellingPrice || scanResult.scanResult.medicine?.mrp || '—'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Stock Available</span>
                          <span className="font-bold text-emerald-600">
                            {scanResult.scanResult.fefoSuggestedBatch?.currentQuantity || 0} units
                          </span>
                        </div>
                      </div>

                      {scanResult.scanResult.warning && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{scanResult.scanResult.warning}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Item not found in DB */
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Barcode "{scanResult.detectedBarcode}" not yet linked in Inventory Master</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {scanResult.extractedDetails?.medicineName 
                          ? `Extracted product label: "${scanResult.extractedDetails.medicineName}"` 
                          : 'You can create a bill item directly using this scanned code or map it to a medicine.'}
                      </p>
                    </div>
                  )}

                  {/* Direct Bill Action Button */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <button
                      onClick={handleAddToBill}
                      className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Make Bill with Scanned Item ({scanResult.detectedBarcode})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ) : scanError ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 text-xs space-y-3 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto" />
                  <p className="font-bold">{scanError}</p>
                  <button 
                    onClick={() => { setScanError(null); setSelectedImage(null); }}
                    className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl"
                  >
                    Try Another Barcode Image
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 space-y-2">
                  <Barcode className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                    Upload or Select Barcode Image to Begin
                  </p>
                  <p className="text-xs text-slate-400">
                    The AI Vision engine will decode any EAN, UPC, 1D barcode or 2D QR matrix and prepare it for billing automatically.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> Dhanvantari AI Vision v3.2
          </span>
          <button
            onClick={() => setIsBarcodeScanOpen(false)}
            className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
