const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

try {
  admin.app();
} catch (e) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = { admin };