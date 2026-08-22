import { collection, deleteDoc, doc, getDoc, getDocs, writeBatch, clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getFirebaseStore } from './firebaseStore';
import { DEFAULT_ASSETS, DEFAULT_BOTTOM_NAV_CONFIG, DEFAULT_DASHBOARD_CARD_DESIGN, DEFAULT_DISPLAY_DENSITY, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_PAYMENT_STATUSES, DEFAULT_PRODUCT_CATEGORIES, DEFAULT_SHOP_INFO, DEFAULT_STANDARD_SETS, DEFAULT_SYSTEM_TAGS, DEFAULT_THEME, DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';
import type { AppConfig } from '../types';

export const FACTORY_RESET_COLLECTIONS = ['transactions','customers','appointments','warranties','recurring_transactions','quick_notes','category_budgets','settings'] as const;
export type FactoryResetCollection = typeof FACTORY_RESET_COLLECTIONS[number];
export type FactoryResetProgress = { collection: FactoryResetCollection | 'app_config'; completed: number; total: number; phase: 'deleting' | 'verifying' | 'complete' };
const BATCH_LIMIT = 450;

/** Authorize again at execution time; the destructive service never trusts UI visibility alone. */
export async function assertFactoryResetAuthorized(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Factory reset requires an authenticated user');

  const profile = await getDoc(doc(db, 'users', currentUser.uid));
  const data = profile.exists() ? profile.data() : null;
  const role = data?.role;
  const status = data?.status ?? 'active';
  const permissions = data?.permissions ?? {};
  const isAdminOrOwner = role === 'admin' || role === 'owner';
  if (status !== 'active' || !isAdminOrOwner || permissions.canManageDatabase !== true || permissions.canManageSettings !== true) {
    throw new Error('Factory reset requires an active Admin/Owner with database and settings permissions');
  }
}

async function deleteCollectionInBatches(collectionName: FactoryResetCollection, onProgress?: (progress: FactoryResetProgress) => void): Promise<number> {
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
  onProgress?.({ collection: collectionName, completed: total, total, phase: 'verifying' });
  if (!remaining.empty) throw new Error(`Factory reset verification failed for ${collectionName}: ${remaining.size} documents remain`);
  onProgress?.({ collection: collectionName, completed: total, total, phase: 'complete' });
  return total;
}

export async function resetBusinessData(onProgress?: (progress: FactoryResetProgress) => void): Promise<Record<FactoryResetCollection, number>> {
  await assertFactoryResetAuthorized();
  const counts = {} as Record<FactoryResetCollection, number>;
  for (const collectionName of FACTORY_RESET_COLLECTIONS) counts[collectionName] = await deleteCollectionInBatches(collectionName, onProgress);
  return counts;
}

export async function resetAppConfigToFactoryDefaults(userId: string): Promise<void> {
  await assertFactoryResetAuthorized();
  const factoryConfig: AppConfig = {
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    customCategoryTabs: [],
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    paymentStatuses: DEFAULT_PAYMENT_STATUSES,
    dashboardWidgets: DEFAULT_WIDGET_CONFIG,
    dashboardCardDesign: DEFAULT_DASHBOARD_CARD_DESIGN,
    bottomNav: DEFAULT_BOTTOM_NAV_CONFIG,
    theme: DEFAULT_THEME,
    displayDensity: DEFAULT_DISPLAY_DENSITY,
    standardSets: DEFAULT_STANDARD_SETS,
    productCategories: DEFAULT_PRODUCT_CATEGORIES,
    assets: DEFAULT_ASSETS,
    systemTags: DEFAULT_SYSTEM_TAGS,
    shopInfo: DEFAULT_SHOP_INFO,
  } as unknown as AppConfig;
  const client = getFirebaseStore();
  const { error } = await client.from('app_config').upsert({ id: 'app', config: JSON.parse(JSON.stringify(factoryConfig)), updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Factory reset could not persist app configuration: ${message}`);
  }
  const verify = await getDoc(doc(db, 'app_config', 'app'));
  if (!verify.exists() || !verify.data()?.config) throw new Error('Factory reset verification failed: app configuration was not persisted');
}

export async function deleteLegacyConfigDocument(): Promise<void> {
  await assertFactoryResetAuthorized();
  await deleteDoc(doc(db, 'config', 'app'));
}

/** Clears browser state and the persistent Firestore IndexedDB cache before reload. */
export async function clearLocalApplicationState(): Promise<void> {
  localStorage.clear();
  sessionStorage.clear();
  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
  try {
    // Firestore must be terminated before its already-started persistent cache can be cleared.
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (error) {
    // Cache cleanup is best-effort; server-side reset has already been verified.
    console.warn('[Factory reset] Firestore local cache cleanup was unavailable:', error);
  }
}
