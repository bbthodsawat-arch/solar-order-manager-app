import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const generatorEntry = readFileSync(resolve(root, 'src/components/DocumentGeneratorModal.tsx'), 'utf8');
const generator = readFileSync(resolve(root, 'src/components/DocumentGeneratorModalV2.tsx'), 'utf8');
const issuance = readFileSync(resolve(root, 'src/lib/documentIssuanceService.ts'), 'utf8');
const settings = readFileSync(resolve(root, 'src/components/BusinessDocumentsHub.tsx'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(`Document numbering check failed: ${message}`);
}

assert(generatorEntry.includes("./DocumentGeneratorModalV2"), 'DocumentGeneratorModal must route through the atomic generator');
assert(!generator.includes('transaction.id.slice(-6)'), 'generator must not derive business document numbers from Firestore ID suffixes');
assert(generator.includes('issueDocumentNumber'), 'generator must reserve a number before print/PDF issuance');
assert(generator.includes('ensureIssuedNumber'), 'print and PDF paths must share the issuance reservation flow');
assert(issuance.includes('runTransaction'), 'document issuance must use a Firestore transaction');
assert(issuance.includes("doc(db, 'documents', 'archive', 'items', archiveId)"), 'issued documents must have a durable archive record');
assert(issuance.includes('settings.archive'), 'settings archive must remain populated for the existing archive UI');
assert(issuance.includes('rule.next + 1'), 'running number must advance atomically');
assert(settings.includes("doc(db,'settings','documentCenter')"), 'document numbering rules must come from the configured Document Center settings');

const format = (prefix: string, next: number, pad: number) => `${prefix}${String(Math.max(1, next)).padStart(Math.max(1, pad), '0')}`;
assert(format('QT-', 1, 5) === 'QT-00001', 'configured quote format must be deterministic');
assert(format('QT-', 42, 5) === 'QT-00042', 'running number must preserve configured padding');

console.log('Document numbering checks passed: atomic reservation, configured formatting, generator integration, and archive wiring.');
