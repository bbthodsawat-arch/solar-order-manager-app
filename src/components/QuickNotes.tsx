import React, { useState, useMemo } from 'react';
import { useQuickNotes } from '../hooks/useQuickNotes';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { format, isToday, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StickyNote, Plus, Trash2, Star, Calendar, User, Clock, 
  Link as LinkIcon, Unlink, Search, Filter, Edit3, Check, 
  X, ArrowUpRight, ArrowDownRight, Sparkles, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Transaction } from '../types';

const PRESET_CHIPS = [
  'หักมัดจำล่วงหน้าแล้ว',
  'รอใบกำกับภาษี',
  'ส่งของเรียบร้อย',
  'เงินสดหน้าร้าน',
  'รอสลิปโอน',
  'เบิกล่วงหน้า'
];

export default function QuickNotes() {
  const { notes, loading, addNote, updateNote, deleteNote, toggleNoteImportance } = useQuickNotes();
  const { transactions } = useTransactions();
  const { user, appUser } = useAuth();
  
  const [newNote, setNewNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showTxPicker, setShowTxPicker] = useState(false);
  const [txPickerSearch, setTxPickerSearch] = useState('');
  
  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'linked' | 'general' | 'important'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Transactions list for picker
  const filteredPickerTxs = useMemo(() => {
    if (!txPickerSearch.trim()) return transactions.slice(0, 15);
    const q = txPickerSearch.toLowerCase();
    return transactions.filter(t => {
      const cat = (t.category || '').toLowerCase();
      const customer = (t.saleOrderDetails?.customerName || '').toLowerCase();
      const detail = (t.detail || '').toLowerCase();
      const amountStr = t.amount?.toString() || '';
      return cat.includes(q) || customer.includes(q) || detail.includes(q) || amountStr.includes(q);
    }).slice(0, 15);
  }, [transactions, txPickerSearch]);

  // Filtered notes in feed
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // Tab filter
      if (activeTab === 'linked' && !n.transactionId) return false;
      if (activeTab === 'general' && n.transactionId) return false;
      if (activeTab === 'important' && !n.isImportant) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = n.content.toLowerCase().includes(q);
        const userMatch = (n.userDisplayName || '').toLowerCase().includes(q);
        const catMatch = (n.transactionCategory || '').toLowerCase().includes(q);
        const detailMatch = (n.transactionDetail || '').toLowerCase().includes(q);
        return contentMatch || userMatch || catMatch || detailMatch;
      }

      return true;
    });
  }, [notes, activeTab, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    if (newNote.trim().length > 300) {
      toast.error('ความยาวของโน้ตต้องไม่เกิน 300 ตัวอักษร');
      return;
    }

    setSubmitting(true);
    try {
      await addNote(newNote, isImportant, selectedTx);
      setNewNote('');
      setIsImportant(false);
      setSelectedTx(null);
      setShowTxPicker(false);
      toast.success(selectedTx ? 'บันทึกโน้ตและผูกกับรายการเงินสำเร็จ' : 'บันทึกโน้ตช่วยจำเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถบันทึกโน้ตได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, transactionId?: string) => {
    try {
      await deleteNote(id, transactionId);
      toast.success('ลบโน้ตช่วยจำเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถลบโน้ตได้');
    }
  };

  const handleUpdate = async (id: string, transactionId?: string) => {
    if (!editContent.trim()) return;
    try {
      await updateNote(id, editContent.trim(), undefined, transactionId);
      toast.success('แก้ไขโน้ตเรียบร้อย');
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      console.error(error);
      toast.error('แก้ไขโน้ตไม่สำเร็จ');
    }
  };

  const handleToggleImportance = async (id: string, currentStatus: boolean) => {
    try {
      await toggleNoteImportance(id, currentStatus);
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถปรับสถานะความสำคัญได้');
    }
  };

  const formatNoteDate = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      if (isToday(date)) {
        return `วันนี้, ${format(date, 'HH:mm')} น.`;
      }
      return format(date, 'd MMM yyyy, HH:mm น.', { locale: th });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 transition-colors flex flex-col h-[560px]">
      
      {/* Component Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <StickyNote size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-black text-base flex items-center">
              บันทึกช่วยจำ (Quick Notes)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              จดหมายเหตุรายจ่าย งานขาย หรือแนบคำอธิบายรายการธุรกรรม
            </p>
          </div>
        </div>
        
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
          รวม {notes.length} รายการ
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2 mb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('linked')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'linked'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <LinkIcon size={11} />
              <span>ผูกรายการเงิน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              ทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('important')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-0.5 ${
                activeTab === 'important'
                  ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="เฉพาะที่สำคัญ"
            >
              <Star size={11} className="fill-amber-400 text-amber-500" />
            </button>
          </div>

          <div className="relative flex-1 max-w-[130px] sm:max-w-[170px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโน้ต..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Quick Add Form Section */}
      <form onSubmit={handleSubmit} className="mb-3 shrink-0 space-y-2">
        <div className="relative">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="พิมพ์ข้อความบันทึกช่วยจำ... (เช่น 'ส่งของให้ช่างต้อมวันนี้', 'หักมัดจำแล้ว')"
            maxLength={300}
            rows={2}
            className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 dark:focus:border-amber-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none font-medium transition-colors"
          />
          <div className="absolute right-2.5 bottom-2 text-[9.5px] text-slate-400 font-bold">
            {newNote.length}/300
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1">
          {PRESET_CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setNewNote(prev => prev ? `${prev} ${chip}` : chip)}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              +{chip}
            </button>
          ))}
        </div>

        {/* Attached Transaction Preview Pill (if selected) */}
        {selectedTx && (
          <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/60 flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                selectedTx.type === 'income' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
              }`}>
                {selectedTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {selectedTx.saleOrderDetails?.customerName || selectedTx.category}
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                ฿{selectedTx.amount?.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
              title="ยกเลิกการผูกรายการนี้"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Transaction Picker Dropdown Modal */}
        {showTxPicker && (
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                <LinkIcon size={12} className="text-amber-500" />
                <span>เลือกรายการธุรกรรมที่จะผูกบันทึก</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTxPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์ค้นหาลูกค้า, หมวดหมู่, ยอดเงิน..."
                value={txPickerSearch}
                onChange={(e) => setTxPickerSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {filteredPickerTxs.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    setSelectedTx(tx);
                    setShowTxPicker(false);
                  }}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-100 dark:border-slate-800 hover:border-amber-300 transition-colors flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center space-x-2 overflow-hidden mr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {tx.saleOrderDetails?.customerName || tx.category}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tx.detail || format(parseISO(tx.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black text-xs shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}฿{tx.amount?.toLocaleString()}
                  </span>
                </div>
              ))}
              {filteredPickerTxs.length === 0 && (
                <p className="text-center py-4 text-[11px] text-slate-400">ไม่พบรายการเงินที่ค้นหา</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Link to transaction button */}
            <button
              type="button"
              onClick={() => setShowTxPicker(!showTxPicker)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedTx
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <LinkIcon size={12} />
              <span>{selectedTx ? 'เปลี่ยนรายการ' : 'ผูกกับรายการเงิน'}</span>
            </button>

            {/* Important toggle switch */}
            <button
              type="button"
              onClick={() => setIsImportant(!isImportant)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isImportant
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 shadow-3xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Star size={13} className={isImportant ? 'fill-amber-400 text-amber-500' : ''} />
              <span>สำคัญ</span>
            </button>
          </div>

          {/* Add Note Button */}
          <button
            type="submit"
            disabled={submitting || !newNote.trim()}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>บันทึก</span>
          </button>
        </div>
      </form>

      {/* Scrollable Notes List Section */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 py-8">
            <Clock size={20} className="text-slate-400 animate-spin" />
            <span className="text-[11px] text-slate-400 font-bold">กำลังโหลดโน้ต...</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredNotes.map((note) => {
              const isCreator = user?.uid === note.createdBy;
              const isAdmin = appUser?.role === 'admin' || appUser?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
              const canDelete = isCreator || isAdmin;
              const isEditing = editingNoteId === note.id;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    note.isImportant
                      ? 'bg-amber-50/60 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40'
                      : 'bg-slate-50/60 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800/80'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-amber-400 rounded-xl outline-none text-slate-900 dark:text-white"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => note.id && handleUpdate(note.id, note.transactionId)}
                          className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-1.5">
                          {/* Attached transaction badge pill if linked */}
                          {note.transactionId && (
                            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/50 mb-1 max-w-full">
                              <LinkIcon size={10} className="shrink-0 text-amber-600 dark:text-amber-400" />
                              <span className="truncate">
                                {note.transactionCategory || 'รายการธุรกรรม'}
                              </span>
                              {note.transactionAmount !== undefined && (
                                <span className={`font-black ${
                                  note.transactionType === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                }`}>
                                  (฿{note.transactionAmount.toLocaleString()})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Text content */}
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-bold whitespace-pre-wrap break-words">
                            {note.content}
                          </p>
                        </div>

                        {/* Action controls */}
                        <div className="flex items-center space-x-0.5 shrink-0">
                          {/* Star Important toggle */}
                          <button
                            onClick={() => note.id && handleToggleImportance(note.id, note.isImportant || false)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              note.isImportant
                                ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                            }`}
                            title={note.isImportant ? 'ยกเลิกการติดดาว' : 'ติดดาวให้โน้ตสำคัญ'}
                          >
                            <Star size={13} className={note.isImportant ? 'fill-amber-400 text-amber-500' : ''} />
                          </button>

                          {/* Edit button */}
                          {isCreator && (
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id || null);
                                setEditContent(note.content);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              title="แก้ไขโน้ต"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {/* Delete button (visible if user is creator or admin) */}
                          {canDelete && (
                            <button
                              onClick={() => note.id && handleDelete(note.id, note.transactionId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              title="ลบข้อความ"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Note footer with author details & metadata */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600">
                            {note.userPhotoURL ? (
                              <img src={note.userPhotoURL} alt={note.userDisplayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={10} className="text-slate-500 mx-auto mt-0.5" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {note.userDisplayName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
                          <Clock size={10} />
                          <span>{formatNoteDate(note.createdAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
            
            {filteredNotes.length === 0 && (
              <div className="h-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <StickyNote size={18} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">ไม่พบบันทึกช่วยจำ</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px]">
                    เพิ่มโน้ตสำคัญเพื่อแนบกับรายการธุรกรรมหรือบันทึกประจำวันของร้าน
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
