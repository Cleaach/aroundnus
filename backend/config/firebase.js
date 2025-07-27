const admin = require('firebase-admin');

if (process.env.NODE_ENV !== 'test') {
  const serviceAccount = require('/etc/secrets/serviceAccountKey.json');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'aroundnus-fa582.firebasestorage.app',
    });
  } catch (e) {
    // App may already be initialized
    if (e.code !== 'app/duplicate-app') {
      console.error('Firebase admin initialization error', e);
    }
  }
}

module.exports = { admin };