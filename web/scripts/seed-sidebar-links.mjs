/** Create the default credit sidebar link once the credit article exists. */
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), databaseURL: process.env.FIREBASE_DATABASE_URL });
const db = getDatabase(app);
const articles = (await db.ref('articles').get()).val() ?? {};
const credit = Object.values(articles).find((article) => article?.slug === 'credit');
if (!credit) throw new Error('ไม่พบบทความ slug credit');
const links = (await db.ref('sidebarLinks').get()).val() ?? {};
if (Object.values(links).some((link) => link?.articleSlug === 'credit')) { console.log('Credit sidebar link already exists.'); process.exit(0); }
await db.ref('sidebarLinks').push({ label: 'เครดิต', articleSlug: 'credit', section: 'other' });
console.log('Created credit sidebar link.');
