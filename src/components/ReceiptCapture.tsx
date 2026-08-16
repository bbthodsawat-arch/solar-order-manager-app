import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Eye, X, RefreshCw, Upload, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReceiptCaptureProps {
  receiptUrl?: string;
  onChange: (url: string | undefined) => void;
}

export default function ReceiptCapture({ receiptUrl, onChange }: ReceiptCaptureProps) {
  const [isCapturingWebcam, setIsCapturingWebcam] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compress File / Image to lightweight Data URL
  const processAndCompressImage = (file: File) => {
    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.70 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
          onChange(dataUrl);
          toast.success('แนบรูปสลิป/ใบเสร็จสำเร็จ');
        }
        setCompressing(false);
      };
      img.onerror = () => {
        toast.error('ไม่สามารถอ่านไฟล์รูปภาพได้');
        setCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  // Start live webcam stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCapturingWebcam(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('กรุณาอนุญาตการเข้าถึงกล้อง (Camera Permission) ในเบราว์เซอร์เพื่อถ่ายรูปใบเสร็จ');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('ไม่พบอุปกรณ์กล้องในเครื่องนี้ กรุณาเลือกรูปภาพจากคลังรูปแทน');
      } else {
        toast.error('ไม่สามารถเปิดกล้องได้ กรุณาเปิดสิทธิ์กล้องหรือเลือกรูปจากคลังภาพแทน');
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingWebcam(false);
  };

  const captureFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
      onChange(dataUrl);
      toast.success('ถ่ายรูปสลิป/ใบเสร็จเรียบร้อย');
    }
    stopWebcam();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        สลิป/รูปใบเสร็จรับเงิน ( Receipt Photo )
      </label>

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={nativeCameraRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileGalleryRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When Receipt is attached */}
      {receiptUrl ? (
        <div className="relative rounded-2xl border border-green-200 dark:border-green-800/60 bg-green-50/50 dark:bg-green-950/20 p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 border border-green-300 dark:border-green-700">
              <img
                src={receiptUrl}
                alt="Receipt Preview"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setIsPreviewOpen(true)}
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <Check size={14} className="text-green-600 dark:text-green-400 font-bold" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  แนบสลิปเรียบร้อยแล้ว
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                คลิกที่รูปเพื่อขยายดูใบเสร็จ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl transition-colors"
              title="ดูรูปขยาย"
            >
              <Eye size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                toast.success('ลบรูปสลิปเรียบร้อยแล้ว');
              }}
              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
              title="ลบรูปสลิป"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Action buttons when no image is attached */
        <div className="grid grid-cols-3 gap-2">
          {/* Direct Camera Permission Live Stream Button */}
          <button
            type="button"
            disabled={compressing}
            onClick={startWebcam}
            className="flex flex-col items-center justify-center space-y-1 py-3 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold transition-all shadow-2xs"
            title="เปิดกล้องถ่ายสดผ่านเบราว์เซอร์"
          >
            <Camera size={20} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold">กล้องถ่ายสด (Webcam)</span>
          </button>

          {/* Mobile Direct Native Camera Button */}
          <button
            type="button"
            disabled={compressing}
            onClick={() => nativeCameraRef.current?.click()}
            className="flex flex-col items-center justify-center space-y-1 py-3 px-2 bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-500/30 rounded-2xl text-xs font-bold transition-all shadow-2xs"
            title="ถ่ายด้วยกล้องมือถือ"
          >
            <Camera size={20} className="text-sky-600 dark:text-sky-400" />
            <span className="text-[11px] font-bold">กล้องมือถือ</span>
          </button>

          {/* Upload File / Gallery Button */}
          <button
            type="button"
            disabled={compressing}
            onClick={() => fileGalleryRef.current?.click()}
            className="flex flex-col items-center justify-center space-y-1 py-3 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all shadow-2xs"
            title="เลือกรูปสลิปจากอัลบั้ม"
          >
            <ImageIcon size={20} className="text-slate-500 dark:text-slate-300" />
            <span className="text-[11px] font-bold">เลือกจากคลังรูป</span>
          </button>
        </div>
      )}

      {/* Live Webcam Modal for desktop/browser preview */}
      {isCapturingWebcam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
            <div className="p-3 bg-gray-950 flex justify-between items-center border-b border-gray-800">
              <span className="text-xs font-bold text-white flex items-center">
                <Camera size={16} className="mr-1.5 text-green-400" /> ถ่ายรูปสลิป/ใบเสร็จ
              </span>
              <button onClick={stopWebcam} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center min-h-[300px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[60vh] object-contain"
              />
            </div>

            <div className="p-4 bg-gray-950 flex justify-around items-center border-t border-gray-800">
              <button
                type="button"
                onClick={stopWebcam}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={captureFromWebcam}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center space-x-2"
              >
                <Camera size={18} />
                <span>กดถ่ายรูป</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Fullscreen Preview Modal */}
      {isPreviewOpen && receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-2xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
            <div className="p-3 bg-gray-950 flex justify-between items-center border-b border-gray-800">
              <span className="text-xs font-bold text-white">รูปสลิป / ใบเสร็จรับเงิน</span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center bg-black/90 min-h-[300px]">
              <img
                src={receiptUrl}
                alt="Receipt Full"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-950 flex justify-between items-center border-t border-gray-800">
              <button
                onClick={() => {
                  onChange(undefined);
                  setIsPreviewOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg flex items-center font-medium"
              >
                <Trash2 size={14} className="mr-1" /> ลบรูปภาพนี้
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
