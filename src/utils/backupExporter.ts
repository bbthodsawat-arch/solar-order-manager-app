import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BackupDataStructure } from '../components/DatabaseBackupSettings';
import toast from 'react-hot-toast';

export async function exportDatabaseBackupJSON(shopName = 'ร้านกลางนาโซล่าเซลล์'): Promise<boolean> {
  const loadingToast = toast.loading('กำลังรวบรวมข้อมูลเพื่อสำรองไฟล์ JSON...');

  try {
    // Fetch Config
    const configDocRef = doc(db, 'config', 'app');
    const configSnap = await getDoc(configDocRef);
    const configData = configSnap.exists() ? configSnap.data() : null;

    // Fetch Transactions
    const transactionsSnap = await getDocs(collection(db, 'transactions'));
    const transactionsData = transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Recurring Transactions
    const recurringSnap = await getDocs(collection(db, 'recurring_transactions'));
    const recurringData = recurringSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Customers
    const customersSnap = await getDocs(collection(db, 'customers'));
    const customersData = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Quick Notes
    const notesSnap = await getDocs(collection(db, 'quick_notes'));
    const notesData = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const backupData: BackupDataStructure = {
      exportedAt: new Date().toISOString(),
      version: '1.2',
      appName: 'SolarShop Accounting & POS',
      shopName: configData?.shopInfo?.name || shopName,
      summary: {
        transactionsCount: transactionsData.length,
        customersCount: customersData.length,
        recurringCount: recurringData.length,
        quickNotesCount: notesData.length,
        hasConfig: !!configData
      },
      collections: {
        config: configData,
        transactions: transactionsData,
        recurring_transactions: recurringData,
        customers: customersData,
        quick_notes: notesData,
        users: usersData
      }
    };

    // Create JSON Blob
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `SolarShop_Backup_${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record last backup timestamp
    const nowIso = new Date().toISOString();
    localStorage.setItem('solar_app_last_backup_date', nowIso);

    toast.success(`สำรองข้อมูลสำเร็จเรียบร้อย (${transactionsData.length} ธุรกรรม, ${customersData.length} ลูกค้า)`, { id: loadingToast });
    return true;
  } catch (error) {
    console.error('Backup export error:', error);
    toast.error('ไม่สามารถสำรองข้อมูลได้ กรุณาลองใหม่อีกครั้ง', { id: loadingToast });
    return false;
  }
}
