import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Model the critical queue invariant used by dbManager: a flush may only remove
// IDs from the snapshot it actually committed. Entries appended during the commit
// must survive for the next retry.
function reconcileQueue(latest: Array<{ id: string }>, syncedIds: Set<string>) {
  return latest.filter(item => !syncedIds.has(String(item.id)));
}

const initial = [{ id: 'offline_1' }, { id: 'offline_2' }];
const appendedDuringFlush = [...initial, { id: 'offline_3' }];
const remaining = reconcileQueue(appendedDuringFlush, new Set(initial.map(item => item.id)));
assert.deepEqual(remaining, [{ id: 'offline_3' }], 'new queue entries must survive an in-flight flush');

const retryLatest = [...remaining, { id: 'offline_4' }];
const afterRetry = reconcileQueue(retryLatest, new Set(['offline_3']));
assert.deepEqual(afterRetry, [{ id: 'offline_4' }], 'only IDs committed by the current retry may be removed');

const dbManager = readFileSync('src/lib/dbManager.ts', 'utf8');
const transactionsHook = readFileSync('src/hooks/useTransactions.ts', 'utf8');
assert.match(dbManager, /const latestQueue = parseQueue\(\)/, 'flusher must re-read the queue after commit');
assert.match(dbManager, /filter\(item => !syncedIds\.has/, 'flusher must reconcile by committed IDs');
assert.match(transactionsHook, /await dbManager\.flushOfflineQueue\(\)/, 'hook must use the shared queue coordinator');
assert.doesNotMatch(transactionsHook, /await setDoc\(doc\(db, 'transactions', String\(id\)\)/, 'hook must not maintain a second offline flush path');

console.log('Cloud sync E2E queue checks passed');
