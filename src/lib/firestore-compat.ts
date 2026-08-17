import { db } from './firebase';
import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  getDocs as firestoreGetDocs,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  query as firestoreQuery,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  onSnapshot as firestoreOnSnapshot,
  writeBatch as firestoreWriteBatch,
  deleteField as firestoreDeleteField,
  serverTimestamp as firestoreServerTimestamp,
  Timestamp as FirestoreTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';

type Ref = { kind: 'doc' | 'collection'; collection: string; id?: string; constraints?: QueryConstraint[] };

const requireDb = () => {
  if (!db) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* environment variables.');
  return db;
};

export const collection = (_db: unknown, name: string): Ref => ({ kind: 'collection', collection: name });
export const doc = (_db: unknown, name: string, id: string): Ref => ({ kind: 'doc', collection: name, id });
export const where = (field: string, op: any, value: unknown) => firestoreWhere(field, op, value);
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => firestoreOrderBy(field, direction);
export const limit = (value: number) => firestoreLimit(value);
export const query = (r: Ref, ...constraints: QueryConstraint[]): Ref => ({ ...r, constraints });
export const deleteField = () => firestoreDeleteField();

const toFirestoreRef = (r: Ref) => {
  const database = requireDb();
  return r.kind === 'doc' ? firestoreDoc(database, r.collection, r.id!) : firestoreCollection(database, r.collection);
};

const toSnapshotDoc = (snapshot: any) => ({
  id: snapshot.id,
  data: () => snapshot.data(),
  exists: () => snapshot.exists(),
  ref: snapshot.ref,
});

const toCompatQuerySnapshot = (snapshot: any) => ({
  empty: snapshot.empty,
  size: snapshot.size,
  docs: snapshot.docs.map(toSnapshotDoc),
});

export const getDocs = async (r: Ref) => {
  const ref = toFirestoreRef(r);
  const snapshot = await firestoreGetDocs(r.constraints?.length ? firestoreQuery(ref as any, ...r.constraints) : ref as any);
  return toCompatQuerySnapshot(snapshot);
};

export const getDocsFromServer = getDocs;
export const getDocsFromCache = getDocs;

export const getDoc = async (r: Ref) => {
  const snapshot = await firestoreGetDoc(toFirestoreRef(r) as any);
  return toSnapshotDoc(snapshot);
};

export const setDoc = async (r: Ref, data: DocumentData, options?: { merge?: boolean }) => {
  if (r.kind !== 'doc') throw new Error('setDoc requires a document reference');
  await firestoreSetDoc(toFirestoreRef(r) as any, data, options ?? {});
};

export const addDoc = async (r: Ref, data: DocumentData) => {
  if (r.kind !== 'collection') throw new Error('addDoc requires a collection reference');
  const created = await firestoreAddDoc(toFirestoreRef(r) as any, data);
  return { id: created.id, collection: r.collection, ref: created };
};

export const updateDoc = async (r: Ref, data: DocumentData) => {
  if (r.kind !== 'doc') throw new Error('updateDoc requires a document reference');
  await firestoreUpdateDoc(toFirestoreRef(r) as any, data);
};

export const deleteDoc = async (r: Ref) => {
  if (r.kind !== 'doc') throw new Error('deleteDoc requires a document reference');
  await firestoreDeleteDoc(toFirestoreRef(r) as any);
};

export const writeBatch = (_db: unknown) => {
  const batch = firestoreWriteBatch(requireDb());
  return {
    set: (r: Ref, data: DocumentData, options?: { merge?: boolean }) => batch.set(toFirestoreRef(r) as any, data, options ?? {}),
    update: (r: Ref, data: DocumentData) => batch.update(toFirestoreRef(r) as any, data),
    delete: (r: Ref) => batch.delete(toFirestoreRef(r) as any),
    commit: () => batch.commit(),
  };
};

export const onSnapshot = (r: Ref, next: (snapshot: any) => void, error?: (e: unknown) => void) => {
  try {
    const ref = toFirestoreRef(r);
    const target = r.constraints?.length ? firestoreQuery(ref as any, ...r.constraints) : ref;
    return firestoreOnSnapshot(
      target as any,
      (snapshot: any) => next(r.kind === 'doc' ? toSnapshotDoc(snapshot) : toCompatQuerySnapshot(snapshot)),
      error,
    );
  } catch (e) {
    error?.(e);
    return () => undefined;
  }
};

export const serverTimestamp = () => firestoreServerTimestamp();
export const Timestamp = FirestoreTimestamp;
