/** Fill missing RTDB tag slugs from their names. Set DRY_RUN=false to write. */
import { applicationDefault, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const dryRun = process.env.DRY_RUN !== 'false';
const credential = process.env.FIREBASE_SERVICE_ACCOUNT
  ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  : applicationDefault();
const app = getApps()[0] ?? initializeApp({ credential, databaseURL: process.env.FIREBASE_DATABASE_URL });
const db = getDatabase(app);
const snapshot = await db.ref('tags').get();
const updates = {};
const normalize = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
for (const [id, value] of Object.entries(snapshot.val() ?? {})) {
  const tag = value && typeof value === 'object' ? value : {};
  if (!normalize(tag.slug) && normalize(tag.name)) updates[`tags/${id}/slug`] = normalize(tag.name);
}
if (!dryRun && Object.keys(updates).length) await db.ref().update(updates);
console.log(`${dryRun ? 'Would backfill' : 'Backfilled'} ${Object.keys(updates).length} tag slug(s).`);
