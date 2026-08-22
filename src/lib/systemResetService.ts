import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const FACTORY_RESET_COLLECTIONS = [
  'transactions',
  'customers',
  'appointments',
  'warranties',
  'recurring_transactions',
  'quick_notes',
  'category_budgets',
  'settings',
] as const;

export type FactoryResetCollection = typeof FACTORY_RESET_COLLECTIONS[number];
export type FactoryResetProgress = {
  collection: FactoryResetCollection | 'app_config';
  completed: number;
  total: number;
  phase: 'deleting' | 'verifying' | 'complete';
};

const BATCH_LIMIT = 450;

async function deleteCollectionInBatches(
  collectionName: FactoryResetCollection,
  onProgress?: (progress: FactoryResetProgress) => void,
): Promise<number> {
  const snapshot = await getDocs(collection(db, collectionName));
  const total = snapshot.size;
  let completed = 0;

  for (let start = 0; start < snapshot.docs.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(start, start + BATCH_LIMIT);
    chunk.forEach((item) => batch.delete(item.ref));
    await batch.commit();
    completed += chunk.length;
    onProgress?.({ collection: collectionName, completed, total, phase: 'deleting' });
  }

  const remaining = await getDocs(collection(db, collectionName));
  if (!remaining.empty) {
    throw new Error(`Factory reset verification failed for ${collectionName}: ${remaining.size} documents remain`);
  }

  onProgress?.({ collection: collectionName, completed: total, total, phase: 'complete' });
  return total;
}

/**
 * Deletes only business/store data. Identity, security and audit collections
 * are intentionally retained so a factory reset never destroys the account
 * that is performing the reset or its security trail.
 */
export async function resetBusinessData(
  onProgress?: (progress: FactoryResetProgress) => void,
): Promise<Record<FactoryResetCollection, number>> {
  const counts = {} as Record<FactoryResetCollection, number>;
  for (const collectionName of FACTORY_RESET_COLLECTIONS) {
    counts[collectionName] = await deleteCollectionInBatches(collectionName, onProgress);
  }
  return counts;
}

export async function deleteLegacyConfigDocument(): Promise<void> {
  // Older builds used /config/app. Removing it keeps the factory reset from
  // resurrecting stale settings if an old backup/import path is reintroduced.
  await deleteDoc(doc(db, 'config', 'app'));
}

export async function clearLocalApplicationState(): Promise<void> {
  localStorage.clear();
  sessionStorage.clear();

  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}
