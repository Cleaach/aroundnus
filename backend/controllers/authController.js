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

        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const userTemplate = {
                bookmarkedLocations: [],
                email: email,
                friendRequests: {
                    received: [],
                    sent: [],
                },
                friends: [],
                sharedLocation: [],
            };
            await userRef.set(userTemplate);
            return res.status(201).json({ message: "User document created", user: userTemplate });
        } else {
            return res.status(200).json({ message: "User document already exists" });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    initUserDoc,
}

