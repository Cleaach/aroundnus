const { admin } = require('../config/firebase');

const sendFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { targetUid } = req.body;
    if (!targetUid || uid === targetUid) {
        return res.status(400).json({ error: 'Invalid target user' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const targetRef = admin.firestore().collection('users').doc(targetUid);
        const userDoc = await userRef.get();
        const targetDoc = await targetRef.get();
        if (!targetDoc.exists) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        if ((userDoc.data().friends || []).includes(targetUid)) {
            return res.status(400).json({ error: 'Already friends' });
        }
        if ((userDoc.data().friendRequests?.sent || []).includes(targetUid)) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }
        await userRef.update({
            'friendRequests.sent': admin.firestore.FieldValue.arrayUnion(targetUid)
        });
        await targetRef.update({
            'friendRequests.received': admin.firestore.FieldValue.arrayUnion(uid)
        });
        return res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getReceivedFriendRequests = async (req, res) => {
    const { uid } = req.user;
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();
        const received = userDoc.data().friendRequests?.received || [];
        return res.status(200).json({ received });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const getSentFriendRequests = async (req, res) => {
    const { uid } = req.user;
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();
        const sent = userDoc.data().friendRequests?.sent || [];
        return res.status(200).json({ sent });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const approveFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { requesterUid } = req.body;
    if (!requesterUid) {
        return res.status(400).json({ error: 'Invalid requester' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const requesterRef = admin.firestore().collection('users').doc(requesterUid);
        const userDoc = await userRef.get();
        const requesterDoc = await requesterRef.get();
        if (!requesterDoc.exists) {
            return res.status(404).json({ error: 'Requester not found' });
        }
        await userRef.update({
            'friendRequests.received': admin.firestore.FieldValue.arrayRemove(requesterUid),
            'friends': admin.firestore.FieldValue.arrayUnion(requesterUid)
        });
        await requesterRef.update({
            'friendRequests.sent': admin.firestore.FieldValue.arrayRemove(uid),
            'friends': admin.firestore.FieldValue.arrayUnion(uid)
        });
        return res.status(200).json({ message: 'Friend request approved' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const rejectFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { requesterUid } = req.body;
    if (!requesterUid) {
        return res.status(400).json({ error: 'Invalid requester' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const requesterRef = admin.firestore().collection('users').doc(requesterUid);
        await userRef.update({
            'friendRequests.received': admin.firestore.FieldValue.arrayRemove(requesterUid)
        });
        await requesterRef.update({
            'friendRequests.sent': admin.firestore.FieldValue.arrayRemove(uid)
        });
        return res.status(200).json({ message: 'Friend request rejected' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const searchUsersByDisplayName = async (req, res) => {
    const { displayName } = req.query;
    if (!displayName || typeof displayName !== 'string') {
        return res.status(400).json({ error: 'Missing displayName query' });
    }
    try {
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.get();
        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.displayName && data.displayName.toLowerCase().includes(displayName.toLowerCase())) {
                results.push({ uid: doc.id, displayName: data.displayName });
            }
        });
        return res.status(200).json({ users: results });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const removeFriend = async (req, res) => {
    const { uid } = req.user;
    const { friendUid } = req.body;
    if (!friendUid || uid === friendUid) {
        return res.status(400).json({ error: 'Invalid friend UID' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const friendRef = admin.firestore().collection('users').doc(friendUid);
        await userRef.update({
            friends: admin.firestore.FieldValue.arrayRemove(friendUid)
        });
        await friendRef.update({
            friends: admin.firestore.FieldValue.arrayRemove(uid)
        });
        return res.status(200).json({ message: 'Friend removed' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    sendFriendRequest,
    getReceivedFriendRequests,
    getSentFriendRequests,
    approveFriendRequest,
    rejectFriendRequest,
    searchUsersByDisplayName,
    removeFriend
}; 