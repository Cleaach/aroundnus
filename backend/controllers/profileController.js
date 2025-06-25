const { admin } = require('../config/firebase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const upload = multer({ storage: multer.memoryStorage() }); 


const getProfileData = async (req, res) => {
  const { uid } = req.user; 
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    res.status(200).json({
      email: userData.email,
      profilePicture: userData.profilePicture,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateProfilePicture = async (req, res) => {
  const { uid } = req.user;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const bucket = admin.storage().bucket();

    // Delete old profile picture if exists
    const userDoc = await userRef.get();
    const oldProfilePicture = userDoc.data().profilePicture;
    if (oldProfilePicture) {
      let oldProfilePicturePath = oldProfilePicture;
      if (oldProfilePicture.startsWith('https://firebasestorage.googleapis.com/')) {
        const url = new URL(oldProfilePicture);
        const path = url.pathname.split('/o/')[1];
        if (path) oldProfilePicturePath = decodeURIComponent(path.split('?')[0]);
      }
      await bucket.file(oldProfilePicturePath).delete().catch(() => {});
    }

    // Upload new profile picture
    const newFileName = `profilePictures/${uid}_${Date.now()}.jpg`;
    const file = bucket.file(newFileName);
    const uuid = uuidv4();

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    // Construct the download URL
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newFileName)}?alt=media&token=${uuid}`;

    await userRef.update({ profilePicture: downloadUrl });

    res.status(200).json({ message: 'Profile picture updated successfully', url: downloadUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { updateProfilePicture, getProfileData };