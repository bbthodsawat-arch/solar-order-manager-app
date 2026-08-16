import { useState, useMemo } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { useWarranties } from '../hooks/useWarranties';
import { useCustomers } from '../hooks/useCustomers';
import { useAppConfig } from '../hooks/useAppConfig';
import { InstallationAppointment, WarrantyCard, AppointmentStatus } from '../types';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Calendar, ShieldCheck, Sun, Plus, Search, Filter, 
  Clock, MapPin, Phone, User, CheckCircle2, AlertCircle, 
  Wrench, Printer, FileText, Sparkles, RefreshCw, ChevronRight, Cpu
} from 'lucide-react';
import AppointmentModal from '../components/AppointmentModal';
import WarrantyModal from '../components/WarrantyModal';
import WarrantyCardModal from '../components/WarrantyCardModal';
import { toast } from 'react-hot-toast';

type SubTab = 'appointments' | 'warranties' | 'cleanings';

export default function InstallationWarrantyManager() {
  const { appointments, loading: loadingAppts, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { warranties, loading: loadingWarrs, addWarranty, updateWarranty, deleteWarranty } = useWarranties();
  const { customers } = useCustomers();
  const { config } = useAppConfig();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<InstallationAppointment | null>(null);

  const [isWarrModalOpen, setIsWarrModalOpen] = useState(false);
  const [editingWarr, setEditingWarr] = useState<WarrantyCard | null>(null);
  const [warrFromAppt, setWarrFromAppt] = useState<InstallationAppointment | null>(null);

  const [isPrintCertOpen, setIsPrintCertOpen] = useState(false);
  const [viewingCertWarr, setViewingCertWarr] = useState<WarrantyCard | null>(null);

  // Status Badge Helper
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={12} className="mr-1 animate-pulse" />
            รอดำเนินการ
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Calendar size={12} className="mr-1" />
            ยืนยันวันนัดแล้ว
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Wrench size={12} className="mr-1 animate-spin" style={{ animationDuration: '4s' }} />
            กำลังติดตั้งหน้างาน
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} className="mr-1" />
            ติดตั้งเสร็จสิ้น
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle size={12} className="mr-1" />
            ยกเลิกนัดหมาย
          </span>
        );
      default:
        return null;
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = 
        !searchQuery ||
        a.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phoneNumber?.includes(searchQuery) ||
        a.appointmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.solarPackage?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = selectedStatus === 'all' || a.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [appointments, searchQuery, selectedStatus]);

  // Filtered Warranties
  const filteredWarranties = useMemo(() => {
    return warranties.filter(w => {
      const matchSearch =
        !searchQuery ||
        w.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.customerPhone?.includes(searchQuery) ||
        w.warrantyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.equipments?.some(e => e.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [warranties, searchQuery]);

  // Upcoming Panel Cleaning Reminders
  const upcomingCleanings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return warranties.filter(w => w.nextCleaningDate).sort((a, b) => {
      return (a.nextCleaningDate || '').localeCompare(b.nextCleaningDate || '');
    });
  }, [warranties]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalAppts = appointments.length;
    const pendingCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;
    const totalWarrs = warranties.length;

    return { totalAppts, pendingCount, completedCount, totalWarrs };
  }, [appointments, warranties]);

  // Handlers
  const handleCreateWarrantyFromAppt = (appt: InstallationAppointment) => {
    setWarrFromAppt(appt);
    setEditingWarr(null);
    setIsWarrModalOpen(true);
  };

  const handleQuickStatusChange = async (apptId: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointment(apptId, { status: newStatus });
      toast.success('อัปเดตสถานะติดตั้งเรียบร้อยแล้ว');
    } catch (err) {
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const shopInfo = config.shopInfo || { name: 'ร้านกลางนาโซล่าเซลล์', address: '', phone: '' };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shadow-xs">
            <Sun size={30} className="text-amber-500 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>ระบบนัดหมายติดตั้ง & ออกใบรับประกัน</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                Solar Operations
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดคิวทีมช่างติดตั้ง ออกใบรับประกันระบบ และติดตามกำหนดการล้างแผงรายปี
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingAppt(null);
              setIsApptModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>+ นัดหมายติดตั้งใหม่</span>
          </button>

          <button
            onClick={() => {
              setEditingWarr(null);
              setWarrFromAppt(null);
              setIsWarrModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-extrabold text-xs rounded-2xl transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
          >
            <ShieldCheck size={16} className="text-amber-400" />
            <span>+ ออกใบรับประกัน</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>นัดหมายติดตั้งทั้งหมด</span>
            <Calendar size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalAppts} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
            <span>รอดำเนินการ / ยืนยันแล้ว</span>
            <Clock size={16} className="text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {stats.pendingCount} <span className="text-xs font-normal text-amber-600/70">คิว</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>ติดตั้งเสร็จสมบูรณ์</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {stats.completedCount} <span className="text-xs font-normal text-emerald-600/70">งาน</span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-bold">
            <span>ใบรับประกันในระบบ</span>
            <ShieldCheck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
            {stats.totalWarrs} <span className="text-xs font-normal text-blue-600/70">ฉบับ</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          
          {/* Sub-tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab('appointments')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeSubTab === 'appointments'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={15} />
              <span>ตารางนัดหมาย ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('warranties')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeSubTab === 'warranties'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck size={15} />
              <span>ใบรับประกัน ({warranties.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('cleanings')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeSubTab === 'cleanings'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wrench size={15} />
              <span>กำหนดล้างแผง ({upcomingCleanings.length})</span>
            </button>
          </div>

          {/* Search Box & Status Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อลูกค้า, เบอร์, ซีเรียล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {activeSubTab === 'appointments' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">⏳ รอดำเนินการ</option>
                <option value="confirmed">📅 ยืนยันนัดแล้ว</option>
                <option value="in_progress">🛠️ กำลังติดตั้ง</option>
                <option value="completed">✅ ติดตั้งเสร็จแล้ว</option>
                <option value="cancelled">❌ ยกเลิก</option>
              </select>
            )}
          </div>

        </div>

        {/* Tab 1: Installation Appointments List */}
        {activeSubTab === 'appointments' && (
          <div className="space-y-3">
            {loadingAppts ? (
              <div className="py-12 text-center text-xs text-slate-400">กำลังโหลดข้อมูลนัดหมายติดตั้ง...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Calendar size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-500">ไม่พบนัดหมายติดตั้งตามเงื่อนไขที่ค้นหา</p>
                <button
                  onClick={() => { setEditingAppt(null); setIsApptModalOpen(true); }}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-600 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>สร้างนัดหมายติดตั้งใหม่</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppointments.map((appt) => (
                  <div 
                    key={appt.id}
                    className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div>
                      {/* Header Badge & Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          #{appt.appointmentNumber}
                        </span>
                        {renderStatusBadge(appt.status)}
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{appt.customerName}</span>
                          {appt.systemSizeKw ? (
                            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              {appt.systemSizeKw} kW
                            </span>
                          ) : null}
                        </h4>
                        
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                          <p className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                            <Calendar size={13} />
                            <span>วันนัด: {appt.appointmentDate} ({appt.appointmentTime || '09:00 - 12:00'})</span>
                          </p>
                          {appt.phoneNumber && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              <span>{appt.phoneNumber}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400" />
                            <span className="truncate">{appt.customerAddress || appt.province || 'ไม่ระบุที่อยู่'}</span>
                          </p>
                          {appt.solarPackage && (
                            <p className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                              <Sun size={13} className="text-amber-500" />
                              <span>{appt.solarPackage}</span>
                            </p>
                          )}
                          {appt.teamLead && (
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Wrench size={12} className="text-slate-400" />
                              <span>ทีมช่าง: {appt.teamLead}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Quick Actions */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <select
                        value={appt.status}
                        onChange={(e) => handleQuickStatusChange(appt.id!, e.target.value as AppointmentStatus)}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-extrabold text-slate-700 dark:text-slate-300 outline-none"
                      >
                        <option value="pending">⏳ รอดำเนินการ</option>
                        <option value="confirmed">📅 ยืนยันนัด</option>
                        <option value="in_progress">🛠️ กำลังติดตั้ง</option>
                        <option value="completed">✅ ติดตั้งเสร็จ</option>
                        <option value="cancelled">❌ ยกเลิก</option>
                      </select>

                      <div className="flex items-center space-x-1">
                        {appt.status === 'completed' && (
                          <button
                            onClick={() => handleCreateWarrantyFromAppt(appt)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="ออกใบรับประกันจากงานติดตั้งนี้"
                          >
                            <ShieldCheck size={13} />
                            <span>ออกใบรับประกัน</span>
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingAppt(appt); setIsApptModalOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขนัดหมาย"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Solar Warranty Cards List */}
        {activeSubTab === 'warranties' && (
          <div className="space-y-3">
            {loadingWarrs ? (
              <div className="py-12 text-center text-xs text-slate-400">กำลังโหลดใบรับประกัน...</div>
            ) : filteredWarranties.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <ShieldCheck size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-500">ยังไม่มีใบรับประกันสินค้าตามเงื่อนไขค้นหา</p>
                <button
                  onClick={() => { setEditingWarr(null); setWarrFromAppt(null); setIsWarrModalOpen(true); }}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ ออกใบรับประกันใหม่</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWarranties.map((warr) => (
                  <div 
                    key={warr.id}
                    className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div>
                      {/* Header Warranty No */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          #{warr.warrantyNumber}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {warr.installationDate ? `เริ่ม: ${warr.installationDate}` : ''}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{warr.customerName}</span>
                          {warr.systemWarrantyYears && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              ประกันระบบ {warr.systemWarrantyYears} ปี
                            </span>
                          )}
                        </h4>

                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                          <p className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Sun size={13} className="text-amber-500" />
                            <span>{warr.solarSystemPackage || 'ชุดโซล่าเซลล์'}</span>
                          </p>
                          {warr.customerPhone && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              <span>{warr.customerPhone}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400" />
                            <span className="truncate">{warr.customerAddress || warr.province || '-'}</span>
                          </p>
                          {warr.equipments && warr.equipments.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap gap-1">
                              {warr.equipments.map((eq, i) => (
                                <span key={i} className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                  {eq.name}: {eq.serialNumber || 'ไม่มี S/N'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => { setViewingCertWarr(warr); setIsPrintCertOpen(true); }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Printer size={14} />
                        <span>พิมพ์ใบรับประกัน PDF</span>
                      </button>

                      <button
                        onClick={() => { setEditingWarr(warr); setWarrFromAppt(null); setIsWarrModalOpen(true); }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขใบรับประกัน"
                      >
                        <FileText size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Annual Solar Maintenance & Cleaning Reminders */}
        {activeSubTab === 'cleanings' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench size={18} className="text-amber-600" />
                <span><strong>ตารางแจ้งเตือนล้างแผงโซล่าเซลล์รายปี:</strong> แสดงรายชื่อลูกค้าที่มีกำหนดการล้างแผงโซล่าเซลล์หรือตรวจเช็คสภาพระบบตามสัญญาประกัน</span>
              </div>
            </div>

            {upcomingCleanings.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">ยังไม่มีข้อมูลกำหนดล้างแผงโซล่าเซลล์</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {upcomingCleanings.map((warr) => (
                  <div key={warr.id} className="p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{warr.customerName}</span>
                        <span className="font-mono text-[10px] text-slate-400">#{warr.warrantyNumber}</span>
                      </div>
                      <p className="text-slate-500">
                        {warr.customerPhone} • {warr.customerAddress} ({warr.province})
                      </p>
                      <p className="font-bold text-amber-700 dark:text-amber-400">
                        แพ็กเกจ: {warr.solarSystemPackage || 'ระบบโซล่าเซลล์'} | โควตาล้างฟรี: {warr.freeCleaningCountPerYear || 1} ครั้ง/ปี
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block">กำหนดล้างแผงถัดไป</span>
                        <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                          {warr.nextCleaningDate || '-'}
                        </span>
                      </div>

                      <button
                        onClick={() => { setViewingCertWarr(warr); setIsPrintCertOpen(true); }}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <ShieldCheck size={14} className="text-amber-500" />
                        <span>ดูลายละเอียด</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isApptModalOpen}
        appointment={editingAppt}
        customers={customers}
        onClose={() => setIsApptModalOpen(false)}
        onSave={async (data) => {
          if (editingAppt?.id) {
            await updateAppointment(editingAppt.id, data);
          } else {
            await addAppointment(data as any);
          }
        }}
      />

      {/* Warranty Modal */}
      <WarrantyModal
        isOpen={isWarrModalOpen}
        warranty={editingWarr}
        fromAppointment={warrFromAppt}
        customers={customers}
        onClose={() => setIsWarrModalOpen(false)}
        onSave={async (data) => {
          if (editingWarr?.id) {
            await updateWarranty(editingWarr.id, data);
          } else {
            await addWarranty(data as any);
          }
        }}
      />

      {/* PDF Warranty Card Certificate Print Modal */}
      <WarrantyCardModal
        isOpen={isPrintCertOpen}
        warranty={viewingCertWarr}
        shopInfo={shopInfo}
        onClose={() => setIsPrintCertOpen(false)}
      />

    </div>
  );
}
