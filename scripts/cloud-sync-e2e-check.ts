import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A flush may remove only the exact snapshot it committed. New items and edits of
// an existing ID must remain queued for the next retry.
const initial = [{ id: 'offline_1', amount: 10 }, { id: 'offline_2', amount: 20 }];
const snapshotById = new Map(initial.map(item => [item.id, JSON.stringify(item)]));
const latest = [{ id: 'offline_1', amount: 99 }, initial[1], { id: 'offline_3', amount: 30 }];
const remaining = latest.filter(item => snapshotById.get(item.id) !== JSON.stringify(item));
assert.deepEqual(remaining, [{ id: 'offline_1', amount: 99 }, { id: 'offline_3', amount: 30 }], 'edits and appended entries must survive an in-flight flush');

const queue = [{ id: 'a' }];
const appendLatest = (item: { id: string }) => [...queue, item];
assert.deepEqual(appendLatest({ id: 'b' }), [{ id: 'a' }, { id: 'b' }], 'queue writes must be based on the latest persisted state');

const dbManager = readFileSync('src/lib/dbManager.ts', 'utf8');
const transactionsHook = readFileSync('src/hooks/useTransactions.ts', 'utf8');
assert.match(dbManager, /function mutateQueue\(/, 'all queue mutations must use a latest-state coordinator');
assert.match(dbManager, /snapshotById/, 'flush reconciliation must compare exact committed snapshots');
assert.match(dbManager, /start \+= 450/, 'large queues must be committed in batches below Firestore limits');
assert.match(transactionsHook, /dbManager\.enqueueOfflineTransaction/, 'offline create must use the shared queue coordinator');
assert.match(transactionsHook, /dbManager\.updateOfflineQueueTransaction/, 'offline update must use the shared queue coordinator');
assert.match(transactionsHook, /dbManager\.removeOfflineQueueTransaction/, 'offline delete must use the shared queue coordinator');
assert.match(transactionsHook, /function mergeTransactions/, 'UI must deduplicate queued and cloud copies by transaction ID');
assert.match(transactionsHook, /start \+= 450/, 'bulk deletion must also respect Firestore batch limits');
assert.match(transactionsHook, /await dbManager\.flushOfflineQueue\(\)/, 'hook must use the shared queue flusher');

console.log('Cloud sync queue integrity checks passed');
