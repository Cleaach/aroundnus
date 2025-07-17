const { admin } = require('../config/firebase');

const registerUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const userRecord = await admin.auth().createUser({ email, password });
        res.status(201).json({
            message: 'User created successfully',
            uid: userRecord.uid,
            email: userRecord.email,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const loginUser = async (req, res) => {
    res.status(400).json({ error: 'Login should be handled on the client using Firebase Auth SDK. Send the ID token to the backend for verification.' });
}

const initUserDoc = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const displayName = req.body.displayName || "";
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);
        const displayNameIndexRef = db.collection('displayNameIndex').doc(displayName.trim().toLowerCase());

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists) {
                throw new Error('User document already exists');
            }
            if (displayName) {
                const displayNameDoc = await transaction.get(displayNameIndexRef);
                if (displayNameDoc.exists) {
                    throw new Error('Display name already taken');
                }
                // Reserve the display name
                transaction.set(displayNameIndexRef, { uid });
            }
            // Create the user document
            transaction.set(userRef, {
                bookmarkedLocations: [],
                email: email,
                displayName: displayName,
                friendRequests: { received: [], sent: [] },
                friends: [],
                sharedLocation: [],
            });
        });

        return res.status(201).json({ message: "User document created" });
    } catch (err) {
        if (err.message === 'Display name already taken') {
            return res.status(409).json({ error: 'Display name already taken' });
        }
        if (err.message === 'User document already exists') {
            return res.status(200).json({ message: "User document already exists" });
        }
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    initUserDoc,
}

