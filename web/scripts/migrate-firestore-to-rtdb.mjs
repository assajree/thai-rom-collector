import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'thairomdb';
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
admin.initializeApp({ credential: admin.credential.applicationDefault(), databaseURL, projectId });
const firestore = admin.firestore();
const database = admin.database();
const collections = ['patches', 'translators', 'tags', 'systems', 'admins'];
const output = {};
for (const name of collections) {
  const snapshot = await firestore.collection(name).get();
  output[name] = Object.fromEntries(snapshot.docs.map((doc) => [doc.id, doc.data()]));
  console.log(`${name}: ${snapshot.size}`);
}
await database.ref('/').update(output);
const verify = await database.ref('/').once('value');
for (const name of collections) console.log(`verified ${name}: ${Object.keys(verify.child(name).val() || {}).length}`);
console.log(`Migrated ${collections.length} nodes to ${databaseURL}`);
