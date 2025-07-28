const { admin } = require('../config/firebase');


const shareLocation = async (req, res) => {
    const { uid } = req.user; 
    const { friendUid, locationName } = req.body;

    if (!friendUid || !locationName) {
        return res.status(400).json({ error: 'Missing friendUid or locationName' });
    }

    try {
        const userRef = admin.firestore().collection('users').doc(uid);

        const updatePath = `sharedLocations.${friendUid}`;
        await userRef.update({
            [updatePath]: admin.firestore.FieldValue.arrayUnion({ locationId: new Date().getTime().toString(), locationName })
        });

        res.status(200).json({ message: 'Location shared successfully' });
    } catch (error) {
        console.error('Error sharing location:', error);
        res.status(500).json({ error: 'Failed to share location' });
    }
};

const getSharedLocations = async (req, res) => {
    const { uid } = req.user; 
    const { friendUid } = req.params; 

    if (!friendUid) {
        return res.status(400).json({ error: 'Missing friendUid parameter' });
    }

    try {
        const friendDoc = await admin.firestore().collection('users').doc(friendUid).get();
        if (!friendDoc.exists) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        const friendData = friendDoc.data();
        const sharedLocationsMap = friendData.sharedLocations || {};

        const locationsSharedWithCurrentUser = sharedLocationsMap[uid] || [];

        res.status(200).json(locationsSharedWithCurrentUser);
    } catch (error) {
        console.error('Error fetching shared locations:', error);
        res.status(500).json({ error: 'Failed to fetch shared locations' });
    }
};

const removeSharedLocation = async (req, res) => {
    const { uid } = req.user;
    const { friendUid, locationName } = req.body;

    if (!friendUid || !locationName) {
        return res.status(400).json({ error: 'Missing friendUid or locationName' });
    }

    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const updatePath = `sharedLocations.${friendUid}`;

        await userRef.update({
            [updatePath]: admin.firestore.FieldValue.arrayRemove({ locationName })
        });

        res.status(200).json({ message: 'Location removed successfully' });
    } catch (error) {
        console.error('Error removing shared location:', error);
        res.status(500).json({ error: 'Failed to remove shared location' });
    }
};

module.exports = {
    shareLocation,
    getSharedLocations,
    removeSharedLocation
};
