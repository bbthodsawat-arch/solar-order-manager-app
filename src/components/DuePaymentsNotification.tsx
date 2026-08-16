import { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Calendar, DollarSign, ExternalLink, X, Volume2, ShieldAlert } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types';
import { format, parseISO, isBefore, isSameDay, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function DuePaymentsNotification() {
  const { transactions, updateTransaction } = useTransactions();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Find unpaid transactions that are due or overdue
  const unpaidItems = useMemo(() => {
    const today = startOfDay(new Date());

    return transactions
      .filter((t) => {
        return (
          t.type === 'income' &&
          t.saleOrderDetails &&
          t.saleOrderDetails.paymentStatus === 'unpaid'
        );
      })
      .map((t) => {
        const delDateStr = t.saleOrderDetails?.deliveryDate || t.date;
        const delDate = startOfDay(parseISO(delDateStr));
        
        let dueStatus: 'overdue' | 'due_today' | 'upcoming' = 'upcoming';
        if (isSameDay(delDate, today)) {
          dueStatus = 'due_today';
        } else if (isBefore(delDate, today)) {
          dueStatus = 'overdue';
        }

        return {
          transaction: t,
          dueStatus,
          deliveryDateObj: delDate,
        };
      })
      .sort((a, b) => a.deliveryDateObj.getTime() - b.deliveryDateObj.getTime());
  }, [transactions]);

  const urgentCount = useMemo(() => {
    return unpaidItems.filter(i => i.dueStatus === 'overdue' || i.dueStatus === 'due_today').length;
  }, [unpaidItems]);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidItems.reduce((sum, item) => sum + item.transaction.amount, 0);
  }, [unpaidItems]);

  // Handle local Web Notification API
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        toast.success('เปิดการแจ้งเตือนเบราว์เซอร์เรียบร้อย');
        // Trigger a test notification
        if (urgentCount > 0) {
          new Notification('แจ้งเตือนยอดค้างชำระ - ร้านกลางนาโซล่าเซลล์', {
            body: `มีรายการค้างชำระครบกำหนด ${urgentCount} รายการ รวม ฿${totalUnpaidAmount.toLocaleString()}`,
            icon: '/favicon.ico'
          });
        }
      } else {
        toast.error('ไม่อนุญาตการแจ้งเตือน');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automatically trigger web notification if urgent items exist and permission is granted
  useEffect(() => {
    if (urgentCount > 0 && notificationPermission === 'granted') {
      const lastNotified = localStorage.getItem('last_payment_notified_date');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (lastNotified !== todayStr) {
        new Notification('แจ้งเตือนยอดค้างชำระ - ร้านกลางนาโซล่าเซลล์', {
          body: `คุณมียอดค้างชำระครบกำหนด/เกินกำหนด ${urgentCount} รายการ รวมเป็นเงิน ฿${totalUnpaidAmount.toLocaleString()} บาท`,
          icon: '/favicon.ico'
        });
        localStorage.setItem('last_payment_notified_date', todayStr);
      }
    }
  }, [urgentCount, notificationPermission, totalUnpaidAmount]);

  const handleMarkAsPaid = async (t: Transaction) => {
    if (!t.id) return;
    try {
      await updateTransaction(t.id, {
        saleOrderDetails: {
          ...t.saleOrderDetails!,
          paymentStatus: 'paid',
          paymentReceivedDate: format(new Date(), 'yyyy-MM-dd')
        }
      });
      toast.success(`อัปเดตสถานะชำระเงินของ ${t.saleOrderDetails?.customerName || 'ลูกค้า'} เป็นชำระแล้ว`);
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  return (
    <>
      {/* Bell Button in Navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        title="การแจ้งเตือนยอดค้างชำระ"
      >
        <Bell size={20} />
        {unpaidItems.length > 0 && (
          <span className={`absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}>
            {unpaidItems.length}
          </span>
        )}
      </button>

      {/* Slide-over / Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    การแจ้งเตือนเก็บเงินลูกค้า
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    รายการ Sale Order ที่รอชำระเงิน ({unpaidItems.length} รายการ)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notification permission banner if not granted */}
            {notificationPermission !== 'granted' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between text-xs">
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  เปิดการแจ้งเตือนบนเบราว์เซอร์เพื่อรับการแจ้งเตือนทันที
                </span>
                <button
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap ml-2"
                >
                  เปิดใช้งาน
                </button>
              </div>
            )}

            {/* Total Summary */}
            <div className="px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 flex justify-between items-center">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                ยอดรวมรอรับชำระทั้งหมด:
              </span>
              <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                ฿{totalUnpaidAmount.toLocaleString()}
              </span>
            </div>

            {/* Notification List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {unpaidItems.length === 0 ? (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <CheckCircle2 size={40} className="mx-auto text-green-500 opacity-80" />
                  <p className="text-sm font-medium">ไม่มีรายการค้างชำระ</p>
                  <p className="text-xs">ลูกค้าทุกท่านชำระเงินครบถ้วนแล้ว</p>
                </div>
              ) : (
                unpaidItems.map(({ transaction: t, dueStatus }) => {
                  const details = t.saleOrderDetails;
                  const dateFormatted = details?.deliveryDate 
                    ? format(parseISO(details.deliveryDate), 'd MMM yyyy', { locale: th }) 
                    : format(parseISO(t.date), 'd MMM yyyy', { locale: th });

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        dueStatus === 'overdue'
                          ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                          : dueStatus === 'due_today'
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            {dueStatus === 'overdue' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-md">
                                เกินกำหนดชำระ
                              </span>
                            )}
                            {dueStatus === 'due_today' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-md">
                                ครบกำหนดวันนี้
                              </span>
                            )}
                            {dueStatus === 'upcoming' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                รอชำระ
                              </span>
                            )}
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {details?.customerName || 'ไม่ระบุชื่อ'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {details?.province ? `จ.${details.province} • ` : ''}
                            {details?.setOption ? `ชุด ${details.setOption}` : t.category}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ฿{t.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1 text-gray-400" />
                          กำหนด: {dateFormatted}
                        </span>
                        <button
                          onClick={() => handleMarkAsPaid(t)}
                          className="px-2.5 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center shadow-sm"
                        >
                          <CheckCircle2 size={12} className="mr-1" />
                          ชำระแล้ว
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
