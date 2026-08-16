import React, { useState, useEffect } from 'react';
import { WarrantyCard, WarrantyEquipmentItem, Customer, InstallationAppointment } from '../types';
import { X, ShieldCheck, Sun, Plus, Trash2, Calendar, User, Phone, MapPin, Cpu, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WarrantyModalProps {
  isOpen: boolean;
  warranty: WarrantyCard | null;
  fromAppointment?: InstallationAppointment | null;
  customers: Customer[];
  onClose: () => void;
  onSave: (data: Omit<WarrantyCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> | Partial<WarrantyCard>) => Promise<void>;
}

export default function WarrantyModal({
  isOpen,
  warranty,
  fromAppointment,
  customers,
  onClose,
  onSave
}: WarrantyModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyStartDate, setWarrantyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [solarSystemPackage, setSolarSystemPackage] = useState('ชุด 5kW Hybrid System');
  const [systemCapacityKw, setSystemCapacityKw] = useState<number>(5);
  const [systemWarrantyYears, setSystemWarrantyYears] = useState<number>(2);
  const [freeCleaningCountPerYear, setFreeCleaningCountPerYear] = useState<number>(2);
  const [nextCleaningDate, setNextCleaningDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [certifiedTechnicianName, setCertifiedTechnicianName] = useState('ทีมช่างบอย (กลางนาโซล่าเซลล์)');
  const [notes, setNotes] = useState('');
  const [equipments, setEquipments] = useState<WarrantyEquipmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (warranty) {
      setCustomerName(warranty.customerName || '');
      setCustomerPhone(warranty.customerPhone || '');
      setCustomerAddress(warranty.customerAddress || '');
      setProvince(warranty.province || 'กรุงเทพมหานคร');
      setInstallationDate(warranty.installationDate || new Date().toISOString().split('T')[0]);
      setWarrantyStartDate(warranty.warrantyStartDate || new Date().toISOString().split('T')[0]);
      setSolarSystemPackage(warranty.solarSystemPackage || 'ชุด 5kW Hybrid System');
      setSystemCapacityKw(warranty.systemCapacityKw || 5);
      setSystemWarrantyYears(warranty.systemWarrantyYears || 2);
      setFreeCleaningCountPerYear(warranty.freeCleaningCountPerYear || 2);
      setNextCleaningDate(warranty.nextCleaningDate || new Date().toISOString().split('T')[0]);
      setCertifiedTechnicianName(warranty.certifiedTechnicianName || 'ทีมช่างบอย (กลางนาโซล่าเซลล์)');
      setNotes(warranty.notes || '');
      setEquipments(warranty.equipments || []);
    } else if (fromAppointment) {
      setCustomerName(fromAppointment.customerName || '');
      setCustomerPhone(fromAppointment.phoneNumber || '');
      setCustomerAddress(fromAppointment.customerAddress || '');
      setProvince(fromAppointment.province || 'กรุงเทพมหานคร');
      setInstallationDate(fromAppointment.appointmentDate || new Date().toISOString().split('T')[0]);
      setWarrantyStartDate(fromAppointment.appointmentDate || new Date().toISOString().split('T')[0]);
      setSolarSystemPackage(fromAppointment.solarPackage || 'ชุด 5kW Hybrid System');
      setSystemCapacityKw(fromAppointment.systemSizeKw || 5);
      setSystemWarrantyYears(2);
      setFreeCleaningCountPerYear(2);
      setCertifiedTechnicianName(fromAppointment.teamLead || 'ทีมช่างบอย (กลางนาโซล่าเซลล์)');
      setNotes('');
      // Pre-fill initial equipment sample items
      setEquipments([
        { id: '1', itemType: 'panel', name: 'แผงโซล่าเซลล์ Mono Half-Cell', brandModel: 'LONGI 550W', serialNumber: 'SN-PN-2026-001', quantity: 10, warrantyYears: 12 },
        { id: '2', itemType: 'inverter', name: 'อินเวอร์เตอร์ Hybrid Inverter', brandModel: 'Deye 5kW High-Volt', serialNumber: 'SN-INV-5KW-9821', quantity: 1, warrantyYears: 5 },
        { id: '3', itemType: 'battery', name: 'แบตเตอรี่ LiFePO4 Battery', brandModel: '314Ah 51.2V', serialNumber: 'SN-BAT-314-4482', quantity: 1, warrantyYears: 5 }
      ]);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setProvince('กรุงเทพมหานคร');
      setInstallationDate(new Date().toISOString().split('T')[0]);
      setWarrantyStartDate(new Date().toISOString().split('T')[0]);
      setSolarSystemPackage('ชุด 5kW Hybrid System');
      setSystemCapacityKw(5);
      setSystemWarrantyYears(2);
      setFreeCleaningCountPerYear(2);
      setCertifiedTechnicianName('ทีมช่างบอย (กลางนาโซล่าเซลล์)');
      setNotes('');
      setEquipments([
        { id: '1', itemType: 'panel', name: 'แผงโซล่าเซลล์ Mono 550W', brandModel: 'LONGI 550W', serialNumber: 'SN-PANEL-001', quantity: 10, warrantyYears: 12 },
        { id: '2', itemType: 'inverter', name: 'อินเวอร์เตอร์ 5kW', brandModel: 'Deye 5kW', serialNumber: 'SN-INV-001', quantity: 1, warrantyYears: 5 }
      ]);
    }
  }, [warranty, fromAppointment, isOpen]);

  if (!isOpen) return null;

  const handleAddEquipment = () => {
    const newItem: WarrantyEquipmentItem = {
      id: Date.now().toString(),
      itemType: 'panel',
      name: 'แผงโซล่าเซลล์',
      brandModel: '',
      serialNumber: '',
      quantity: 1,
      warrantyYears: 10
    };
    setEquipments(prev => [...prev, newItem]);
  };

  const handleUpdateEquipment = (id: string, field: keyof WarrantyEquipmentItem, value: any) => {
    setEquipments(prev => prev.map(eq => eq.id === id ? { ...eq, [field]: value } : eq));
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('กรุณาระบุชื่อลูกค้า');
      return;
    }

    setIsSubmitting(true);
    try {
      const warNum = warranty?.warrantyNumber || `WAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      await onSave({
        warrantyNumber: warNum,
        appointmentId: fromAppointment?.id || warranty?.appointmentId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        province,
        installationDate,
        warrantyStartDate,
        solarSystemPackage,
        systemCapacityKw: Number(systemCapacityKw) || 0,
        systemWarrantyYears: Number(systemWarrantyYears) || 0,
        freeCleaningCountPerYear: Number(freeCleaningCountPerYear) || 0,
        nextCleaningDate,
        certifiedTechnicianName,
        equipments,
        notes: notes.trim()
      });

      toast.success(warranty ? 'แก้ไขใบบอกรับประกันเรียบร้อย!' : 'ออกใบรับประกันสินค้าสำเร็จ!');
      onClose();
    } catch (err) {
      console.error('Failed to save warranty card:', err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกใบรับประกัน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {warranty ? 'แก้ไขข้อมูลใบรับประกันสินค้า' : 'ออกใบรับประกันสินค้าและงานติดตั้งใหม่'}
              </h3>
              <p className="text-[11px] text-slate-400">Solar Cell Equipment Warranty Card Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Customer & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อลูกค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ชื่อ-นามสกุล ลูกค้า"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                สถานที่ติดตั้ง/ที่อยู่
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="ที่อยู่ติดตั้งระบบ"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Package Specs & Warranty Periods */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชุดโซล่าเซลล์ที่ติดตั้ง
              </label>
              <input
                type="text"
                value={solarSystemPackage}
                onChange={(e) => setSolarSystemPackage(e.target.value)}
                placeholder="เช่น ชุด 5kW Hybrid System"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ขนาดติดตั้ง (kW)
              </label>
              <input
                type="number"
                step="0.1"
                value={systemCapacityKw}
                onChange={(e) => setSystemCapacityKw(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ระยะเวลาประกันระบบ (ปี)
              </label>
              <input
                type="number"
                value={systemWarrantyYears}
                onChange={(e) => setSystemWarrantyYears(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Dates & Cleaning Reminders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                วันที่เริ่มประกัน / ติดตั้งเสร็จ
              </label>
              <input
                type="date"
                value={warrantyStartDate}
                onChange={(e) => setWarrantyStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ล้างแผงฟรี (ครั้ง/ปี)
              </label>
              <input
                type="number"
                value={freeCleaningCountPerYear}
                onChange={(e) => setFreeCleaningCountPerYear(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                กำหนดล้างแผงรอบถัดไป
              </label>
              <input
                type="date"
                value={nextCleaningDate}
                onChange={(e) => setNextCleaningDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Equipment Serial Numbers Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Cpu size={16} className="text-amber-500" />
                <span>รายการอุปกรณ์ & หมายเลขซีเรียล (Serial Numbers)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddEquipment}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>เพิ่มอุปกรณ์</span>
              </button>
            </div>

            <div className="space-y-2">
              {equipments.map((eq, index) => (
                <div key={eq.id || index} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="ชื่ออุปกรณ์ (เช่น แผงโซล่า)"
                      value={eq.name}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="รุ่น/แบรนด์"
                      value={eq.brandModel || ''}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'brandModel', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Serial Number (S/N)"
                      value={eq.serialNumber}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'serialNumber', e.target.value)}
                      className="w-full px-2 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-amber-300"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <input
                      type="number"
                      placeholder="ประกัน (ปี)"
                      value={eq.warrantyYears}
                      onChange={(e) => handleUpdateEquipment(eq.id, 'warrantyYears', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-1 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(eq.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : warranty ? 'บันทึกการแก้ไข' : 'ออกใบรับประกัน'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
