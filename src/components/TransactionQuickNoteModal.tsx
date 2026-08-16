import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StickyNote, X, Plus, Star, Trash2, Edit3, Clock, 
  User, Check, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight,
  Receipt, Tag, MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Transaction, QuickNote } from '../types';
import { useQuickNotes } from '../hooks/useQuickNotes';
import { useAuth } from '../hooks/useAuth';
import SpeechDictationButton from './SpeechDictationButton';

interface TransactionQuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSaved?: () => void;
}

const QUICK_SUGGESTIONS = [
  'หักมัดจำล่วงหน้าแล้ว',
  'รอใบกำกับภาษีตัวจริง',
  'ส่งมอบและติดตั้งเสร็จเรียบร้อย',
  'ลูกค้าชำระเงินสดหน้าร้าน',
  'ช่างขอเบิกล่วงหน้า',
  'รอตรวจสอบสลิปโอนเงิน',
  'โอนคืนส่วนต่างแล้ว',
  'สินค้ารอส่งเคลมประกัน',
  'แถมอุปกรณ์ข้อต่อฟรี'
];

export default function TransactionQuickNoteModal({
  isOpen,
  onClose,
  transaction,
  onSaved
}: TransactionQuickNoteModalProps) {
  const { notes, addNote, updateNote, deleteNote, toggleNoteImportance } = useQuickNotes();
  const { user, appUser } = useAuth();
  
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Attached notes for this transaction
  const txNotes = transaction?.id 
    ? notes.filter(n => n.transactionId === transaction.id) 
    : [];

  useEffect(() => {
    if (isOpen && transaction) {
      setContent(transaction.notes || '');
      setIsImportant(false);
      setEditingNoteId(null);
      setEditContent('');
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const isSale = transaction.type === 'income' && !!transaction.saleOrderDetails;
  const displayName = isSale 
    ? transaction.saleOrderDetails?.customerName 
    : transaction.category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('กรุณาระบุข้อความบันทึกช่วยจำ');
      return;
    }

    setSubmitting(true);
    try {
      await addNote(content.trim(), isImportant, transaction);
      toast.success('แนบบันทึกช่วยจำกับรายการนี้เรียบร้อย');
      setContent('');
      setIsImportant(false);
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถบันทึกข้อความได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateNote(noteId, editContent.trim(), undefined, transaction.id);
      toast.success('แก้ไขบันทึกช่วยจำเรียบร้อย');
      setEditingNoteId(null);
      setEditContent('');
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('แก้ไขบันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId, transaction.id);
      toast.success('ลบบันทึกช่วยจำเรียบร้อย');
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('ลบบันทึกไม่สำเร็จ');
    }
  };

  const formatNoteTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'd MMM yyyy, HH:mm น.', { locale: th });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-6 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <StickyNote size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center">
                บันทึกช่วยจำสำหรับรายการ (Quick Notes)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แนบข้อความช่วยจำ บริบทพิเศษ หรือสถานะติดตามของรายการธุรกรรมนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-6 pb-4">
          <div className={`p-4 rounded-2xl border ${
            transaction.type === 'income'
              ? 'bg-emerald-50/40 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/40'
              : 'bg-rose-50/40 border-rose-200/70 dark:bg-rose-950/20 dark:border-rose-900/40'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                  }`}>
                    {transaction.type === 'income' ? (
                      <>
                        <ArrowDownRight size={12} />
                        <span>รายรับ (Income)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={12} />
                        <span>รายจ่าย (Expense)</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {format(parseISO(transaction.date), 'd MMMM yyyy, HH:mm น.', { locale: th })}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                  {displayName}
                </h4>

                {transaction.detail && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {transaction.detail}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">ยอดเงิน</p>
                <p className={`text-lg font-black tracking-tight ${
                  transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}฿{Number(transaction.amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Annotations Feed */}
        <div className="px-6 pb-4 max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <MessageSquare size={14} className="text-amber-500" />
              <span>โน้ตช่วยจำที่ผูกไว้ ({txNotes.length})</span>
            </span>
          </div>

          {txNotes.length === 0 && (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              ยังไม่มีข้อความช่วยจำสำหรับรายการนี้ เพิ่มข้อความใหม่ด้านล่าง
            </div>
          )}

          <AnimatePresence initial={false}>
            {txNotes.map((note) => {
              const isCreator = user?.uid === note.createdBy;
              const isAdmin = appUser?.role === 'admin' || appUser?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
              const canDelete = isCreator || isAdmin;
              const isEditing = editingNoteId === note.id;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    note.isImportant
                      ? 'bg-amber-50/70 border-amber-300/80 dark:bg-amber-950/30 dark:border-amber-800/60'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-amber-400 rounded-xl outline-none text-slate-900 dark:text-white"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => note.id && handleUpdate(note.id)}
                          className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          บันทึกการแก้ไข
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs text-slate-800 dark:text-slate-100 font-bold whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => note.id && toggleNoteImportance(note.id, note.isImportant || false)}
                            className={`p-1 rounded-lg transition-colors ${
                              note.isImportant ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                            }`}
                            title={note.isImportant ? 'ยกเลิกติดดาว' : 'ติดดาว'}
                          >
                            <Star size={13} className={note.isImportant ? 'fill-amber-400 text-amber-500' : ''} />
                          </button>
                          {isCreator && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id || null);
                                setEditContent(note.content);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="แก้ไขข้อความ"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => note.id && handleDelete(note.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                              title="ลบโน้ต"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            {note.userPhotoURL ? (
                              <img src={note.userPhotoURL} alt={note.userDisplayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={9} className="text-slate-500 mx-auto" />
                            )}
                          </div>
                          <span>{note.userDisplayName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{formatNoteTime(note.createdAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add New Annotation Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                เพิ่มข้อความช่วยจำใหม่
              </label>
              <div className="flex items-center space-x-2">
                <SpeechDictationButton
                  currentValue={content}
                  onTranscript={(text) => setContent(text)}
                  title="พูดเพื่อถอดความพิมพ์ข้อความช่วยจำ"
                />
                <span className="text-[10px] text-slate-400 font-bold">{content.length}/300</span>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="พิมพ์ข้อความสั้นช่วยจำสำหรับรายการนี้..."
              maxLength={300}
              rows={2}
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 dark:focus:border-amber-500 text-slate-900 dark:text-white font-medium resize-none shadow-2xs"
            />
          </div>

          {/* Quick suggestions pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles size={11} className="text-amber-500" />
              <span>ข้อความลัดยอดนิยม:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setContent(prev => prev ? `${prev} • ${sug}` : sug)}
                  className="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 transition-all cursor-pointer shadow-3xs active:scale-95"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsImportant(!isImportant)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isImportant
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                  : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Star size={14} className={isImportant ? 'fill-amber-400 text-amber-500' : ''} />
              <span>ระบุเป็นโน้ตสำคัญ</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>บันทึกโน้ต</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
