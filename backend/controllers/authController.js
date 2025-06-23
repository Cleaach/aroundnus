const { admin } = require('../config/firebase');

const registerUser = async (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName });
        res.status(201).json({
            message: 'User created successfully',
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const loginUser = async (req, res) => {
    res.status(400).json({ error: 'Login should be handled on the client using Firebase Auth SDK. Send the ID token to the backend for verification.' });
}

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const initUserDoc = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const displayName = req.body.displayName || "";

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
                displayName: displayName,
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
    verifyToken,
    initUserDoc,
}

