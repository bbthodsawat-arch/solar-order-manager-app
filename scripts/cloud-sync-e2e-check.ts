import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const initial = [{ id: 'offline_1', amount: 10 }, { id: 'offline_2', amount: 20 }];
const snapshotById = new Map(initial.map(item => [item.id, JSON.stringify(item)]));
const latest = [{ id: 'offline_1', amount: 99 }, initial[1], { id: 'offline_3', amount: 30 }];
const remaining = latest.filter(item => snapshotById.get(item.id) !== JSON.stringify(item));
assert.deepEqual(remaining, [{ id: 'offline_1', amount: 99 }, { id: 'offline_3', amount: 30 }], 'edits and appended entries must survive an in-flight flush');

const dbManager = readFileSync('src/lib/dbManager.ts', 'utf8');
const transactionsHook = readFileSync('src/hooks/useTransactions.ts', 'utf8');
const cloudStatusHook = readFileSync('src/hooks/useCloudSyncStatus.ts', 'utf8');
const firestoreRules = readFileSync('firestore.rules', 'utf8');
assert.match(dbManager, /function mutateQueue\(/, 'all queue mutations must use a latest-state coordinator');
assert.match(dbManager, /snapshotById/, 'flush reconciliation must compare exact committed snapshots');
assert.match(dbManager, /start \+= 450/, 'large queues must be committed in batches below Firestore limits');
assert.match(dbManager, /doc\(db, '__healthcheck', 'cloud-sync'\)/, 'cloud sync health check must use the permitted healthcheck path');
assert.doesNotMatch(dbManager, /doc\(db, 'config', 'app'\)/, 'cloud sync must not probe a Firestore path denied by the deployed rules');
assert.match(firestoreRules, /match \/__healthcheck\/\{documentId\} \{ allow read: if signedIn\(\);/, 'healthcheck read rule must allow authenticated sync clients');
assert.match(transactionsHook, /dbManager\.enqueueOfflineTransaction/, 'offline create must use the shared queue coordinator');
assert.match(transactionsHook, /dbManager\.updateOfflineQueueTransaction/, 'offline update must use the shared queue coordinator');
assert.match(transactionsHook, /dbManager\.removeOfflineQueueTransaction/, 'offline delete must use the shared queue coordinator');
assert.match(transactionsHook, /function mergeTransactions/, 'UI must deduplicate queued and cloud copies by transaction ID');
assert.match(transactionsHook, /start \+= 450/, 'bulk deletion must respect Firestore batch limits');
assert.match(transactionsHook, /await dbManager\.flushOfflineQueue\(\)/, 'transaction hook must use the shared queue flusher');
assert.match(cloudStatusHook, /await dbManager\.flushOfflineQueue\(\)/, 'manual and interval sync must use the shared queue flusher');
assert.doesNotMatch(cloudStatusHook, /addDoc\(/, 'manual sync must not create a second ID-generating upload path');

console.log('Cloud sync queue integrity checks passed');