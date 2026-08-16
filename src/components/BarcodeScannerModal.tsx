import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Barcode, X, Camera, RefreshCw, AlertTriangle, 
  Sparkles, Check, CheckCircle2, Play, Search, Info, Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { soundFeedback, notifyReaction } from '../utils/feedback';
import { ProductCategory, ProductCatalogItem } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCategories: ProductCategory[];
  onProductScanned: (product: ProductCatalogItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  productCategories = [],
  onProductScanned
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedCodeHistory, setScannedCodeHistory] = useState<string[]>([]);
  const [manualCode, setManualCode] = useState('');
  
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-camera-scanner-view';

  // Flat product catalog with barcodes
  const allProducts = React.useMemo(() => {
    return productCategories.flatMap(cat => 
      (cat.items || []).map(item => ({
        ...item,
        categoryName: cat.name,
        categoryColor: cat.color || '#3b82f6'
      }))
    );
  }, [productCategories]);

  // Handle scanned/typed code processing
  const handleCodeDetected = (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    // Search by exact Barcode or SKU
    const found = allProducts.find(p => 
      (p.barcode && p.barcode.trim() === trimmedCode) || 
      (p.sku && p.sku.toLowerCase().trim() === trimmedCode.toLowerCase())
    );

    if (found) {
      // Trigger sound feedback
      try {
        soundFeedback('success');
      } catch (err) {
        console.warn('Audio feedback notice:', err);
      }
      
      onProductScanned(found);
      setScannedCodeHistory(prev => [trimmedCode, ...prev].slice(0, 5));
      notifyReaction('success', `สแกนสำเร็จ: เพิ่ม "${found.name}" (฿${found.price.toLocaleString()})`, { id: 'scan_success' });
    } else {
      try {
        soundFeedback('error');
      } catch (err) {
        console.warn('Audio feedback notice:', err);
      }
      notifyReaction('error', `ไม่พบสินค้าสำหรับรหัส: "${trimmedCode}"`, { id: 'scan_fail' });
    }
  };

  // Quick Simulation Click
  const handleSimulateClick = (barcode: string) => {
    handleCodeDetected(barcode);
  };

  // Start HTML5 Camera QR/Barcode Scanner
  const startCamera = async (cameraId?: string) => {
    setCameraError(null);
    setScannerActive(false);

    try {
      // 1. Fetch available cameras first
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      if (devices.length === 0) {
        setCameraError('ไม่พบกล้องเชื่อมต่อกับอุปกรณ์ของคุณ');
        return;
      }

      const activeCameraId = cameraId || devices[devices.length - 1].id; // default to back camera
      setSelectedCameraId(activeCameraId);

      // 2. Initialize scanner
      if (html5QrcodeRef.current) {
        try {
          if (html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
          }
        } catch (stopErr) {
          console.warn('Stop scanner notice:', stopErr);
        }
      }

      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = scanner;

      // 3. Start scanning
      await scanner.start(
        activeCameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.75;
            return {
              width: size,
              height: size * 0.5 // wider for standard barcodes
            };
          },
          aspectRatio: 1.777778 // 16:9 widescreen
        },
        (decodedText) => {
          // Success Callback
          handleCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Verbose debug scanning logs (ignored for quiet performance)
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        setCameraError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง (Camera Permission Denied) กรุณาเปิดสิทธิ์กล้องในเบราว์เซอร์');
      } else {
        setCameraError(`ไม่สามารถเปิดใช้งานกล้องได้: ${err?.message || 'ข้อผิดพลาดระบบ'}`);
      }
    }
  };

  // Stop camera stream
  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScannerActive(false);
  };

  // Toggle Camera State
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Switch camera handle
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCameraId(id);
    startCamera(id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  // Selected popular demo products to display for easy simulation clicks
  const demoProducts = allProducts.filter(p => p.barcode).slice(0, 5);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8 relative overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 -mx-6 -mt-6 p-5 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand shadow-inner">
                <Barcode size={22} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">กล้องสแกนบาร์โค้ดสินค้า (Real-time Scanner)</h3>
                <p className="text-[11px] text-slate-400 font-medium">สแกนบาร์โค้ด หรือ รหัส SKU เพื่อเพิ่มสินค้าเข้าตะกร้าโดยอัตโนมัติ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left: Camera Feed Scanner Area */}
            <div className="md:col-span-7 flex flex-col space-y-3">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Camera size={13} className="text-brand" />
                วิดีโอจากกล้องถ่ายรูป (Camera Viewport)
              </span>

              {/* Viewport Box */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center min-h-[220px]">
                
                {/* Scanner container needed by html5-qrcode library */}
                <div 
                  id={scannerContainerId} 
                  className={`w-full h-full object-cover ${scannerActive ? 'block' : 'hidden'}`}
                />

                {/* Loading / Error States Overlay */}
                {!scannerActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 p-4 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-brand" />
                    <p className="text-xs font-bold">กำลังเชื่อมต่อกับกล้องถ่ายรูปของคุณ...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 space-y-3 p-6 text-center bg-slate-950">
                    <AlertTriangle className="w-10 h-10 text-rose-500 animate-pulse" />
                    <h4 className="text-sm font-black">ไม่สามารถเปิดใช้กล้องได้</h4>
                    <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => startCamera(selectedCameraId)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      ลองเชื่อมต่อกล้องใหม่อีกครั้ง
                    </button>
                  </div>
                )}

                {/* Laser Overlay Guide when Active */}
                {scannerActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-[80%] h-[35%] border-2 border-dashed border-brand/60 rounded-xl relative">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 animate-[pulse_1s_infinite] shadow-[0_0_10px_#ef4444]" />
                      <div className="absolute top-2 left-2 text-[9px] font-black text-brand uppercase tracking-wider bg-slate-950/80 px-1.5 py-0.5 rounded-md">
                        Barcode Area
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Switcher Controls */}
              {cameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">เลือกกล้อง:</label>
                  <select
                    value={selectedCameraId}
                    onChange={handleCameraChange}
                    className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-white font-bold outline-none"
                  >
                    {cameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right: Manual Code & Quick Simulation Sandbox */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* Part A: Manual Key-in / Trigger Barcode */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search size={13} className="text-indigo-500" />
                  หรือกรอกรหัสบาร์โค้ดด้วยตนเอง
                </span>
                <form onSubmit={handleManualSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="พิมพ์ Barcode หรือ SKU..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-brand transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-brand text-white font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-brand/10"
                  >
                    <span>ค้นหา</span>
                  </button>
                </form>
              </div>

              {/* Part B: Testing Sandbox Simulator - INCREDIBLY POWERFUL UX FOR DEMOS */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="animate-spin text-indigo-500" />
                    กล่องทดลองคลิกสแกนจำลอง (Sandbox Clicker)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    ไม่ต้องใช้กล้องจริง
                  </span>
                </div>
                
                {demoProducts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium py-2 text-center">
                    ไม่มีสินค้าที่มีรหัสบาร์โค้ดในระบบ
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                    {demoProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSimulateClick(p.barcode || '')}
                        className="w-full text-left p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:translate-x-0.5 active:scale-98"
                      >
                        <div className="truncate pr-2">
                          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-900 px-1 py-0.1 rounded text-slate-500 dark:text-slate-400">
                              SKU: {p.sku || 'N/A'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">
                              Barcode: {p.barcode}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">฿{p.price.toLocaleString()}</span>
                          <Play size={8} className="text-emerald-500 fill-emerald-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Part C: Scanned History list */}
              {scannedCodeHistory.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    ประวัติการแสกนล่าสุด:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {scannedCodeHistory.map((historyCode, index) => (
                      <span 
                        key={index} 
                        className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Check size={10} className="text-emerald-500" />
                        {historyCode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Guidelines info footer banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3 rounded-2xl flex gap-2.5 text-[11px] text-blue-700 dark:text-blue-300">
            <Info size={15} className="shrink-0 mt-0.5 text-blue-500" />
            <p className="font-medium">
              <strong>เคล็ดลับความเร็ว:</strong> ในโหมดกล้องจริง แนะนำให้ถือแผ่นบาร์โค้ดให้นิ่ง และส่องบริเวณกลางช่องสแกน ระบบจะเพิ่มสินค้าให้ทันทีและเล่นเสียงสัญญาณ <em>Beep</em> ยืนยันการทำงานโดยอัตโนมัติ
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
