import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Barcode, Camera, X } from 'lucide-react';
import { ProductCategory, ProductCatalogItem } from '../types';
import { notifyReaction, soundFeedback } from '../utils/feedback';

interface BarcodeScannerModalProps { isOpen: boolean; onClose: () => void; productCategories: ProductCategory[]; onProductScanned: (product: ProductCatalogItem) => void; }

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, productCategories = [], onProductScanned }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const products = useMemo(() => productCategories.flatMap(category => category.items || []), [productCategories]);
  const handleCode = (value: string) => {
    const code = value.trim(); if (!code) return;
    const product = products.find(item => (item.barcode && item.barcode.trim() === code) || (item.sku && item.sku.trim().toLowerCase() === code.toLowerCase()));
    if (!product) { soundFeedback.warning(); notifyReaction('error', `ไม่พบสินค้าสำหรับรหัส: "${code}"`, { id: 'scan_fail' }); return; }
    soundFeedback.success(); onProductScanned(product); notifyReaction('success', `สแกนสำเร็จ: เพิ่ม "${product.name}"`, { id: 'scan_success' });
  };
  const stopScanner = async () => { if (!scannerRef.current) return; try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); } catch (error) { console.warn('Unable to stop barcode scanner:', error); } finally { scannerRef.current = null; setScannerActive(false); } };
  const startScanner = async () => {
    setCameraError(null); await stopScanner();
    try { const cameras = await Html5Qrcode.getCameras(); if (!cameras.length) throw new Error('ไม่พบกล้องบนอุปกรณ์'); const scanner = new Html5Qrcode('barcode-camera-scanner-view'); scannerRef.current = scanner; await scanner.start(cameras[cameras.length - 1].id, { fps: 15, qrbox: { width: 280, height: 140 } }, decodedText => handleCode(decodedText), () => undefined); setScannerActive(true); }
    catch (error) { setCameraError(error instanceof Error ? error.message : 'ไม่สามารถเปิดกล้องได้'); setScannerActive(false); }
  };
  useEffect(() => { if (isOpen) void startScanner(); else void stopScanner(); return () => { void stopScanner(); }; }, [isOpen]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Barcode size={20} /><h2 className="font-black">สแกนบาร์โค้ดสินค้า</h2></div><button type="button" onClick={onClose} aria-label="ปิด"><X size={20} /></button></div><div className="relative overflow-hidden rounded-2xl bg-slate-950"><div id="barcode-camera-scanner-view" className="min-h-[280px] w-full" />{!scannerActive && cameraError && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-rose-300"><div><Camera className="mx-auto mb-2" size={28} />{cameraError}<button type="button" onClick={() => void startScanner()} className="mx-auto mt-3 block rounded-xl bg-white/10 px-4 py-2">ลองใหม่</button></div></div>}</div><form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); handleCode(manualCode); setManualCode(''); }}><input value={manualCode} onChange={event => setManualCode(event.target.value)} placeholder="Barcode หรือ SKU" className="min-w-0 flex-1 rounded-xl border px-3 py-2 dark:bg-slate-800" /><button type="submit" className="rounded-xl bg-brand px-4 py-2 font-bold text-white">ค้นหา</button></form></div></div>;
};
