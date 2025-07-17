const { admin } = require('../config/firebase');

// Helper to ensure friendRequests and friends arrays exist
async function ensureUserFriendFields(userRef) {
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;
    const data = userDoc.data();
    const update = {};
    if (!data.friendRequests || typeof data.friendRequests !== 'object') {
        update['friendRequests'] = { received: [], sent: [] };
    } else {
        if (!Array.isArray(data.friendRequests.received)) update['friendRequests.received'] = [];
        if (!Array.isArray(data.friendRequests.sent)) update['friendRequests.sent'] = [];
    }
    if (!Array.isArray(data.friends)) update['friends'] = [];
    if (Object.keys(update).length > 0) await userRef.update(update);
}

// Send a friend request by targetUid
const sendFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { targetUid } = req.body;
    if (!targetUid || uid === targetUid) {
        return res.status(400).json({ error: 'Invalid target user' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const targetRef = admin.firestore().collection('users').doc(targetUid);
        await ensureUserFriendFields(userRef);
        await ensureUserFriendFields(targetRef);
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

// Get received friend requests
const getReceivedFriendRequests = async (req, res) => {
    const { uid } = req.user;
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        await ensureUserFriendFields(userRef);
        const userDoc = await userRef.get();
        const received = userDoc.data().friendRequests?.received || [];
        return res.status(200).json({ received });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Get sent friend requests
const getSentFriendRequests = async (req, res) => {
    const { uid } = req.user;
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        await ensureUserFriendFields(userRef);
        const userDoc = await userRef.get();
        const sent = userDoc.data().friendRequests?.sent || [];
        return res.status(200).json({ sent });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Approve a friend request
const approveFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { requesterUid } = req.body;
    if (!requesterUid) {
        return res.status(400).json({ error: 'Invalid requester' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const requesterRef = admin.firestore().collection('users').doc(requesterUid);
        await ensureUserFriendFields(userRef);
        await ensureUserFriendFields(requesterRef);
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

// Reject a friend request
const rejectFriendRequest = async (req, res) => {
    const { uid } = req.user;
    const { requesterUid } = req.body;
    if (!requesterUid) {
        return res.status(400).json({ error: 'Invalid requester' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const requesterRef = admin.firestore().collection('users').doc(requesterUid);
        await ensureUserFriendFields(userRef);
        await ensureUserFriendFields(requesterRef);
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

// Search users by displayName (case-insensitive, partial match)
const searchUsersByDisplayName = async (req, res) => {
    const { displayName } = req.query;
    if (!displayName || typeof displayName !== 'string') {
        return res.status(400).json({ error: 'Missing displayName query' });
    }
    try {
        const usersRef = admin.firestore().collection('users');
        // Firestore does not support case-insensitive or partial match natively, so we fetch and filter in memory
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

// Remove a friend
const removeFriend = async (req, res) => {
    const { uid } = req.user;
    const { friendUid } = req.body;
    if (!friendUid || uid === friendUid) {
        return res.status(400).json({ error: 'Invalid friend UID' });
    }
    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const friendRef = admin.firestore().collection('users').doc(friendUid);
        // Remove each other from friends arrays
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