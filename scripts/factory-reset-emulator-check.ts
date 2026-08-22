import assert from 'node:assert/strict';

const storage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
};

const local = storage();
const session = storage();
(globalThis as any).window = { localStorage: local, sessionStorage: session };
(globalThis as any).document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };

const { connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = await import('firebase/auth');
const { connectFirestoreEmulator, collection, doc, getDoc, getDocs, setDoc } = await import('firebase/firestore');
const { auth, db, firebaseApp } = await import('../src/lib/firebase.ts');
const { FACTORY_RESET_COLLECTIONS, resetBusinessData, resetAppConfigToFactoryDefaults, deleteLegacyConfigDocument } = await import('../src/lib/systemResetService.ts');

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const ownerEmail = 'b.b.thodsawat@gmail.com';
const ownerPassword = 'FactoryReset-Test-Only-2026!';
const staffEmail = 'factory-reset-staff@example.test';
const staffPassword = 'FactoryReset-Staff-Only-2026!';

async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

async function seedBusinessData() {
  const seedCounts: Record<string, number> = {};
  for (const name of FACTORY_RESET_COLLECTIONS) {
    const count = name === 'customers' ? 451 : 2;
    for (let i = 0; i < count; i += 1) {
      await setDoc(doc(db, name, `factory-reset-test-${name}-${i}`), {
        id: `factory-reset-test-${name}-${i}`,
        testMarker: 'FACTORY_RESET_EMULATOR_TEST',
        index: i,
      });
    }
    seedCounts[name] = count;
  }
  await setDoc(doc(db, 'app_config', 'app'), { config: { testMarker: 'FACTORY_RESET_EMULATOR_TEST' }, updated_by: auth.currentUser!.uid });
  await setDoc(doc(db, 'config', 'app'), { testMarker: 'FACTORY_RESET_EMULATOR_TEST' });
  return seedCounts;
}

async function assertBusinessDataExists() {
  for (const name of FACTORY_RESET_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, name));
    assert.ok(snapshot.size > 0, `${name} should contain seeded test data before reset`);
  }
  assert.ok((await getDoc(doc(db, 'app_config', 'app'))).exists(), 'app_config should exist before reset');
  assert.ok((await getDoc(doc(db, 'config', 'app'))).exists(), 'legacy config should exist before reset');
}

async function assertBusinessDataEmpty() {
  for (const name of FACTORY_RESET_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, name));
    assert.equal(snapshot.size, 0, `${name} must be empty after factory reset`);
  }
}

await createUserWithEmailAndPassword(auth, ownerEmail, ownerPassword).catch((error: any) => {
  if (error?.code !== 'auth/email-already-in-use') throw error;
});
await signIn(ownerEmail, ownerPassword);
const owner = auth.currentUser!;
await setDoc(doc(db, 'users', owner.uid), {
  uid: owner.uid,
  email: ownerEmail,
  username: 'factory-reset-test-owner',
  displayName: 'Factory Reset Test Owner',
  role: 'owner',
  status: 'active',
  permissions: { canManageDatabase: true, canManageSettings: true },
});

await createUserWithEmailAndPassword(auth, staffEmail, staffPassword).catch((error: any) => {
  if (error?.code !== 'auth/email-already-in-use') throw error;
});
await signOut(auth);
await signIn(staffEmail, staffPassword);
const staff = auth.currentUser!;
await setDoc(doc(db, 'users', staff.uid), {
  uid: staff.uid,
  email: staffEmail,
  username: 'factory-reset-test-staff',
  displayName: 'Factory Reset Test Staff',
  role: 'staff',
  status: 'active',
  permissions: { canManageDatabase: false, canManageSettings: false },
});

await signOut(auth);
await signIn(ownerEmail, ownerPassword);
await seedBusinessData();
await assertBusinessDataExists();

await signOut(auth);
await signIn(staffEmail, staffPassword);
await assert.rejects(() => resetBusinessData(), /requires an active Admin\/Owner/);
assert.ok((await getDoc(doc(db, 'customers', 'factory-reset-test-customers-0'))).exists(), 'unauthorized reset must not delete business data');

await signOut(auth);
await signIn(ownerEmail, ownerPassword);
const counts = await resetBusinessData();
assert.equal(counts.customers, 451, 'customer batch test must process more than one Firestore batch');
assert.equal(counts.transactions, 2);
await resetAppConfigToFactoryDefaults(auth.currentUser!.uid);
await deleteLegacyConfigDocument();
await assertBusinessDataEmpty();
const config = await getDoc(doc(db, 'app_config', 'app'));
assert.ok(config.exists(), 'factory defaults must persist after reset');
assert.notEqual(config.data()?.config?.testMarker, 'FACTORY_RESET_EMULATOR_TEST', 'factory config must replace test config');
assert.equal((await getDoc(doc(db, 'config', 'app'))).exists(), false, 'legacy config must be deleted');

console.log(JSON.stringify({
  status: 'passed',
  authorization: 'passed',
  unauthorizedDataPreserved: true,
  collectionsCleared: FACTORY_RESET_COLLECTIONS,
  batchBoundary: '451 customers cleared across multiple batches',
  appConfigReset: true,
  legacyConfigRemoved: true,
  emulatorProject: (firebaseApp.options as any).projectId,
}, null, 2));

await signOut(auth);
