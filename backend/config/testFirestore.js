const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

(async () => {
  try {
    const snapshot = await db.collection('test').get();
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  } catch (err) {
    console.error('🔥 Firestore error:', err);
  }
})();
