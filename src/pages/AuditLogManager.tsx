import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLogEntry, AuditCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, History, Trash2, UserCog, Settings, PlusCircle, Edit3,
  KeyRound, Search, Filter, Download, Calendar, RefreshCw, AlertTriangle,
  FileText, CheckCircle2, Eye, UserX, UserCheck, ArrowRight, Shield, Layers, X
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function AuditLogManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [inspectingLog, setInspectingLog] = useState<AuditLogEntry | null>(null);

  const { logs, rawLogs, loading, error, stats } = useAuditLogs(selectedCategory);

  // Filter logs by date & search query & action
  const finalLogs = logs.filter((log) => {
    // Action filter
    if (actionFilter !== 'all') {
      if (actionFilter === 'DELETE' && !log.action.includes('DELETE')) return false;
      if (actionFilter === 'CREATE' && !log.action.includes('CREATE')) return false;
      if (actionFilter === 'UPDATE' && !log.action.includes('UPDATE')) return false;
      if (actionFilter === 'USER' && log.category !== 'user') return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp).getTime();
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (dateFilter === 'today' && now - logDate > oneDay) return false;
      if (dateFilter === '7days' && now - logDate > 7 * oneDay) return false;
      if (dateFilter === '30days' && now - logDate > 30 * oneDay) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.userDisplayName.toLowerCase().includes(q) || log.userEmail.toLowerCase().includes(q);
      const matchTarget = (log.targetName || '').toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      return matchDetails || matchUser || matchTarget || matchAction;
    }

    return true;
  });

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    if (finalLogs.length === 0) return;

    const headers = ['Timestamp', 'Action', 'Category', 'User Name', 'User Email', 'User Role', 'Target Name', 'Details'];
    const rows = finalLogs.map((log) => [
      log.timestamp,
      `"${log.action}"`,
      `"${log.category}"`,
      `"${log.userDisplayName.replace(/"/g, '""')}"`,
      `"${log.userEmail}"`,
      `"${log.userRole}"`,
      `"${(log.targetName || '').replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-log-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE')) {
      return {
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        icon: Trash2,
        label: 'ลบข้อมูล (Delete)',
      };
    }
    if (action.includes('ROLE') || action.includes('PERM') || action.includes('STATUS')) {
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: KeyRound,
        label: 'ปรับสิทธิ์/บทบาท',
      };
    }
    if (action.includes('CREATE')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: PlusCircle,
        label: 'สร้างใหม่ (Create)',
      };
    }
    if (action.includes('UPDATE') || action.includes('RESTORE')) {
      return {
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Edit3,
        label: 'แก้ไขข้อมูล (Update)',
      };
    }
    return {
      bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: History,
      label: action,
    };
  };

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'transaction':
        return { label: 'รายการธุรกรรม', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' };
      case 'user':
        return { label: 'ผู้ใช้งาน & สิทธิ์', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' };
      case 'settings':
        return { label: 'ตั้งค่าระบบ', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' };
      case 'customer':
        return { label: 'ลูกค้า CRM', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' };
      case 'installation':
        return { label: 'นัดหมาย & รับประกัน', color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' };
      default:
        return { label: 'ระบบทั่วไป', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-soft/20 dark:bg-brand/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <Shield className="text-brand" size={14} />
              <span>Admin Security & Accountability</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <History className="text-brand" size={28} />
              Audit Log (บันทึกประวัติการเปลี่ยนแปลง)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              ติดตามบันทึกการแก้ไข ลบรายการ เปลี่ยนบทบาท หรือปรับเปลี่ยนค่าสำคัญในระบบโดยผู้ดูแลและพนักงานแบบเรียลไทม์ พร้อมการรักษาความปลอดภัยข้อมูลแบบปรับเปลี่ยนไม่ได้ (Immutable Audit Trail)
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={finalLogs.length === 0}
              className="px-4 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Download size={16} />
              <span>ส่งออกรายงาน (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ประวัติกิจกรรมทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <p className="text-[11px] text-slate-400 font-medium">บันทึกในระบบ Firestore</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-200/60 dark:border-rose-950/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">การลบข้อมูล (Deletions)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.deletions}</div>
          <p className="text-[11px] text-slate-400 font-medium">รายการที่ถูกยกเลิก/ลบ</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-200/60 dark:border-amber-950/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">สิทธิ์ & ผู้ใช้งาน</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <UserCog size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.userChanges}</div>
          <p className="text-[11px] text-slate-400 font-medium">ปรับบทบาท / สร้างผู้ใช้</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-950/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">รายการธุรกรรม</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <History size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.transactionChanges}</div>
          <p className="text-[11px] text-slate-400 font-medium">เพิ่ม/แก้ไข/ลบ รายการเงิน</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'transaction', label: 'ธุรกรรมเงิน' },
              { id: 'user', label: 'สิทธิ์ & บัญชี' },
              { id: 'settings', label: 'ตั้งค่าระบบ' },
              { id: 'customer', label: 'ลูกค้า CRM' },
              { id: 'installation', label: 'การติดตั้ง' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action & Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกประเภทการกระทำ</option>
              <option value="DELETE">เฉพาะการลบ (Delete)</option>
              <option value="CREATE">เฉพาะการสร้าง (Create)</option>
              <option value="UPDATE">เฉพาะการแก้ไข (Update)</option>
              <option value="USER">เฉพาะเกี่ยวกับผู้ใช้งาน</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="today">วันนี้ (24 ชม.)</option>
              <option value="7days">7 วันล่าสุด</option>
              <option value="30days">30 วันล่าสุด</option>
            </select>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อผู้ดำเนินการ, อีเมล, รายละเอียด หรือรายการที่ได้รับผลกระทบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>

      {/* Audit Logs Data Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">กำลังโหลดบันทึก Audit Log จาก Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        ) : finalLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">ไม่พบบันทึก Audit Log ที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-slate-400">เมื่อมีกิจกรรมการแก้ไข ลบรายการ หรือปรับบทบาทเกิดขึ้นในระบบ บันทึกจะแสดงขึ้นที่นี่อัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">วัน-เวลา</th>
                  <th className="py-3.5 px-4">ผู้ดำเนินการ (Operator)</th>
                  <th className="py-3.5 px-4">ประเภทกิจกรรม</th>
                  <th className="py-3.5 px-4">เป้าหมาย (Target)</th>
                  <th className="py-3.5 px-4">รายละเอียด (Details)</th>
                  <th className="py-3.5 px-4 text-right">การตรวจสอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {finalLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const catBadge = getCategoryBadge(log.category);
                  const Icon = badge.icon;
                  const logDate = new Date(log.timestamp);
                  const formattedDate = isNaN(logDate.getTime())
                    ? log.timestamp
                    : format(logDate, 'd MMM yyyy HH:mm:ss', { locale: th });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formattedDate}
                      </td>

                      {/* Operator */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                            {log.userDisplayName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {log.userDisplayName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {log.userEmail} • <span className="uppercase text-brand font-bold">{log.userRole}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badge.bg}`}>
                          <Icon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Target Name */}
                      <td className="py-4 px-4 max-w-[180px] truncate">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {log.targetName || '-'}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-4 px-4 max-w-xs sm:max-w-md">
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-2">
                          {log.details}
                        </p>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {(log.previousData || log.newData) ? (
                          <button
                            onClick={() => setInspectingLog(log)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                          >
                            <Eye size={13} className="text-brand" />
                            <span>ดูประวัติ</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Security Notice */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>ระบบเก็บข้อมูล Audit Log โดยตรงไปยัง Cloud Firestore (ไม่สามารถแก้ไขหรือลบย้อนหลังได้)</span>
          </div>
          <span className="font-mono text-[10px]">Total Logs: {finalLogs.length} Records</span>
        </div>
      </div>

      {/* JSON State / Log Details Modal */}
      <AnimatePresence>
        {inspectingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand flex items-center justify-center font-bold">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      รายละเอียดการเปลี่ยนแปลง (Audit State Diff)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      ID: {inspectingLog.id} • {inspectingLog.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingLog(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">คำอธิบายบันทึก:</div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">{inspectingLog.details}</p>
                  <div className="pt-2 flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                    <span>ผู้ทำรายการ: {inspectingLog.userDisplayName} ({inspectingLog.userEmail})</span>
                    <span>บทบาท: {inspectingLog.userRole}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous State */}
                  <div className="space-y-1.5">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center text-[11px]">
                      <Trash2 size={13} className="mr-1" /> ข้อมูลเดิมก่อนแก้ไข (Previous State)
                    </span>
                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                      {inspectingLog.previousData
                        ? JSON.stringify(inspectingLog.previousData, null, 2)
                        : '(ไม่มีข้อมูลเดิม)'}
                    </pre>
                  </div>

                  {/* New State */}
                  <div className="space-y-1.5">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center text-[11px]">
                      <CheckCircle2 size={13} className="mr-1" /> ข้อมูลใหม่ล่าสุด (New State)
                    </span>
                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                      {inspectingLog.newData
                        ? JSON.stringify(inspectingLog.newData, null, 2)
                        : '(ไม่มีข้อมูลใหม่)'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setInspectingLog(null)}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
