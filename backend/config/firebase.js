const admin = require('firebase-admin');
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');
console.log(serviceAccount);

try {
  admin.app();
} catch (e) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'aroundnus-fa582.firebasestorage.app',
  });
}

module.exports = { admin };