import React, { useState, useEffect } from 'react';
import { InstallationAppointment, Customer, AppointmentStatus, ThaiProvinces, SaleOrderSets } from '../types';
import { X, Calendar, Clock, MapPin, User, Phone, Sun, Wrench, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AppointmentModalProps {
  isOpen: boolean;
  appointment: InstallationAppointment | null;
  customers: Customer[];
  onClose: () => void;
  onSave: (data: Omit<InstallationAppointment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> | Partial<InstallationAppointment>) => Promise<void>;
}

export default function AppointmentModal({
  isOpen,
  appointment,
  customers,
  onClose,
  onSave
}: AppointmentModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('09:00 - 12:00');
  const [solarPackage, setSolarPackage] = useState('ชุด 5kW Hybrid System');
  const [systemSizeKw, setSystemSizeKw] = useState<number>(5);
  const [teamLead, setTeamLead] = useState('ทีมช่างบอย');
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appointment) {
      setCustomerName(appointment.customerName || '');
      setPhoneNumber(appointment.phoneNumber || '');
      setCustomerAddress(appointment.customerAddress || '');
      setProvince(appointment.province || 'กรุงเทพมหานคร');
      setAppointmentDate(appointment.appointmentDate || new Date().toISOString().split('T')[0]);
      setAppointmentTime(appointment.appointmentTime || '09:00 - 12:00');
      setSolarPackage(appointment.solarPackage || 'ชุด 5kW Hybrid System');
      setSystemSizeKw(appointment.systemSizeKw || 5);
      setTeamLead(appointment.teamLead || 'ทีมช่างบอย');
      setStatus(appointment.status || 'pending');
      setNotes(appointment.notes || '');
    } else {
      setCustomerName('');
      setPhoneNumber('');
      setCustomerAddress('');
      setProvince('กรุงเทพมหานคร');
      setAppointmentDate(new Date().toISOString().split('T')[0]);
      setAppointmentTime('09:00 - 12:00');
      setSolarPackage('ชุด 5kW Hybrid System');
      setSystemSizeKw(5);
      setTeamLead('ทีมช่างบอย');
      setStatus('pending');
      setNotes('');
    }
  }, [appointment, isOpen]);

  if (!isOpen) return null;

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setPhoneNumber(found.phoneNumber || '');
      setCustomerAddress(found.customerAddress || '');
      setProvince(found.province || 'กรุงเทพมหานคร');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('กรุณาระบุชื่อลูกค้า');
      return;
    }
    if (!appointmentDate) {
      toast.error('กรุณาเลือกวันนัดหมายติดตั้ง');
      return;
    }

    setIsSubmitting(true);
    try {
      const apptNum = appointment?.appointmentNumber || `INS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      await onSave({
        appointmentNumber: apptNum,
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        customerAddress: customerAddress.trim(),
        province,
        appointmentDate,
        appointmentTime,
        solarPackage,
        systemSizeKw: Number(systemSizeKw) || 0,
        teamLead,
        status,
        notes: notes.trim()
      });

      toast.success(appointment ? 'แก้ไขวันนัดหมายสำเร็จ!' : 'บันทึกวันนัดหมายติดตั้งเรียบร้อย!');
      onClose();
    } catch (err) {
      console.error('Failed to save appointment:', err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกนัดหมาย');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {appointment ? 'แก้ไขข้อมูลนัดหมายติดตั้ง' : 'สร้างนัดหมายติดตั้งโซล่าเซลล์ใหม่'}
              </h3>
              <p className="text-[11px] text-slate-400">Solar Installation Appointment Schedule</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Quick Customer Select */}
          {customers.length > 0 && !appointment && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                เลือกลูกค้าจากฐานข้อมูล (Quick Select):
              </label>
              <select
                onChange={handleSelectCustomer}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">-- เลือกลูกค้าเดิม หรือ กรอกข้อมูลใหม่ด้านล่าง --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ''} - {c.province}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อลูกค้า <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณสมชาย สายชล"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location & Province */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                สถานที่ติดตั้ง (ที่อยู่)
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="เช่น 123/45 หมู่ 3 ต.ในเมือง อ.เมือง"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                จังหวัด
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {ThaiProvinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                วันนัดหมายติดตั้ง <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ช่วงเวลานัดหมาย
              </label>
              <div className="relative">
                <Clock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="08:30 - 12:00">08:30 - 12:00 (ช่วงเช้า)</option>
                  <option value="09:00 - 12:00">09:00 - 12:00 (ช่วงเช้า)</option>
                  <option value="13:00 - 17:00">13:00 - 17:00 (ช่วงบ่าย)</option>
                  <option value="ทั้งวัน (09:00 - 17:00)">ทั้งวัน (09:00 - 17:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Solar Package & kW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                แพ็กเกจโซล่าเซลล์ที่ติดตั้ง
              </label>
              <div className="relative">
                <Sun size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={solarPackage}
                  onChange={(e) => setSolarPackage(e.target.value)}
                  placeholder="เช่น ชุด 5kW Hybrid + แบตเตอรี่ 48V"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ขนาดติดตั้ง (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={systemSizeKw}
                onChange={(e) => setSystemSizeKw(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Team Lead & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                หัวหน้าทีมช่างติดตั้ง
              </label>
              <div className="relative">
                <Wrench size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={teamLead}
                  onChange={(e) => setTeamLead(e.target.value)}
                  placeholder="เช่น ทีมช่างบอย / ทีม A"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                สถานะนัดหมาย
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="pending">⏳ รอดำเนินการ (Pending)</option>
                <option value="confirmed">📅 ยืนยันวันนัดแล้ว (Confirmed)</option>
                <option value="in_progress">🛠️ กำลังติดตั้ง (In Progress)</option>
                <option value="completed">✅ ติดตั้งเสร็จสิ้น (Completed)</option>
                <option value="cancelled">❌ ยกเลิกนัดหมาย (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              หมายเหตุเพิ่มเติม / ข้อสังเกตหน้างาน
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น บ้านสองชั้น หลังคาซีแพคโมเนีย ต้องเตรียมบันไดยาว 6 เมตร"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>

          {/* Submit Action Buttons */}
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
              <span>{isSubmitting ? 'กำลังบันทึก...' : appointment ? 'บันทึกการแก้ไข' : 'สร้างนัดหมาย'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
