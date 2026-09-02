/**
 * Rename legacy createDate values to updateDate and fill missing dates.
 * Usage: set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path,
 * then run `npm run backfill:create-date` from web/.
 */
import admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const patches = await db.collection('patches').get();
const timestamp = new Date().toISOString();
let count = 0;
let batch = db.batch();
let pending = 0;

for (const snapshot of patches.docs) {
  const legacyDate = snapshot.get('createDate');
  const updateDate = typeof snapshot.get('updateDate') === 'string' && snapshot.get('updateDate').trim()
    ? snapshot.get('updateDate') : (typeof legacyDate === 'string' && legacyDate.trim() ? legacyDate : timestamp);
  batch.update(snapshot.ref, { updateDate, createDate: admin.firestore.FieldValue.delete() });
  count += 1;
  pending += 1;
  if (pending === 500) {
    await batch.commit();
    batch = db.batch();
    pending = 0;
  }
}

if (pending > 0) await batch.commit();
console.log(`Backfilled ${count} patch document(s) with ${timestamp}.`);
