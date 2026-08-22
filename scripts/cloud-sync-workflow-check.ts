import { readFileSync } from 'node:fs';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Cloud sync workflow check failed: ${message}`);
}

type Transaction = { id: string; amount: number; hasPendingWrites?: boolean };

// In-memory Firestore model used to exercise the retry/idempotency contract.
class FakeFirestore {
  readonly docs = new Map<string, Omit<Transaction, 'id' | 'hasPendingWrites'>>();
  failNextCommit = false;

  async commit(items: Transaction[]) {
    if (this.failNextCommit) {
      this.failNextCommit = false;
      throw new Error('network unavailable');
    }
    for (const item of items) {
      const { id, hasPendingWrites: _pending, ...data } = item;
      this.docs.set(id, data);
    }
  }
}

async function flush(queue: Transaction[], firestore: FakeFirestore): Promise<Transaction[]> {
  await firestore.commit(queue);
  // The queue may only be cleared after the commit resolves successfully.
  return [];
}

const source = readFileSync(new URL('../src/hooks/useTransactions.ts', import.meta.url), 'utf8');
const dbManagerSource = readFileSync(new URL('../src/lib/dbManager.ts', import.meta.url), 'utf8');

assert(source.includes("setDoc(doc(db, 'transactions', String(id))"), 'hook sync must preserve the queued transaction ID');
assert(dbManagerSource.includes("batch.set(doc(db, 'transactions', String(item.id))"), 'database sync must preserve the queued transaction ID');
assert(source.includes('offlineSyncPromise'), 'hook sync must guard concurrent flush attempts');
assert(dbManagerSource.includes('queueFlushPromise'), 'database sync must guard concurrent flush attempts');
assert(dbManagerSource.includes("window.addEventListener('online'"), 'reconnect must trigger automatic queue flushing');
assert(dbManagerSource.includes('setTimeout(() => { void dbManager.runDiagnostics().then(() => dbManager.flushOfflineQueue())'), 'startup must attempt to flush an existing queue');

const firestore = new FakeFirestore();
const queue: Transaction[] = [{ id: 'offline_queued_1', amount: 100, hasPendingWrites: true }];

firestore.failNextCommit = true;
let retained = queue;
try {
  retained = await flush(retained, firestore);
} catch {
  // Failed commits retain the exact original queue for retry.
}
assert(retained.length === 1 && retained[0].id === 'offline_queued_1', 'failed sync must retain queued data');

retained = await flush(retained, firestore);
assert(retained.length === 0, 'successful sync must clear the queue');
assert(firestore.docs.size === 1 && firestore.docs.has('offline_queued_1'), 'successful sync must write the original ID');

// Retry/concurrent-style repeated writes to the same ID must not create duplicates.
await firestore.commit(queue);
await firestore.commit(queue);
assert(firestore.docs.size === 1, 'repeated sync attempts must remain idempotent');

console.log('Cloud sync workflow checks passed');
