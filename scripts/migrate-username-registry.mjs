/**
 * One-time migration for the public usernames registry.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin-service-account.json \
 *   FIREBASE_PROJECT_ID=careerdesk node scripts/migrate-username-registry.mjs
 *
 * Review the dry-run summary, then add --apply to remove legacy email/uid fields.
 * Never commit service-account credentials to this repository.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const projectId = process.env.FIREBASE_PROJECT_ID || 'careerdesk';

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const snapshot = await db.collection('usernames').get();

let changed = 0;
let alreadyClean = 0;
const batchLimit = 400;
let batch = db.batch();
let pending = 0;

for (const document of snapshot.docs) {
  const data = document.data();
  const username = typeof data.username === 'string' ? data.username : document.id;
  const safeData = { username };
  if (typeof data.updatedAt === 'number') safeData.updatedAt = data.updatedAt;

  const hasPrivateFields = Object.prototype.hasOwnProperty.call(data, 'email')
    || Object.prototype.hasOwnProperty.call(data, 'uid');
  const hasUnexpectedFields = Object.keys(data).some(key => !['username', 'updatedAt'].includes(key));

  if (!hasPrivateFields && !hasUnexpectedFields && data.username === username) {
    alreadyClean++;
    continue;
  }

  changed++;
  if (apply) {
    batch.set(document.ref, safeData);
    pending++;
    if (pending >= batchLimit) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
}

if (apply && pending > 0) await batch.commit();

console.log(JSON.stringify({
  projectId,
  mode: apply ? 'APPLIED' : 'DRY_RUN',
  totalDocuments: snapshot.size,
  documentsNeedingMigration: changed,
  alreadyClean,
  note: apply
    ? 'Legacy public username documents were rewritten to contain username and optional updatedAt only.'
    : 'No data was changed. Re-run with --apply after reviewing this summary.'
}, null, 2));
