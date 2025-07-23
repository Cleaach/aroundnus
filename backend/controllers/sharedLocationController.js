const { admin } = require('../config/firebase');

// Share a location with a specific friend
const shareLocation = async (req, res) => {
    const { uid } = req.user; // The user sharing the location
    const { friendUid, locationName } = req.body;

    if (!friendUid || !locationName) {
        return res.status(400).json({ error: 'Missing friendUid or locationName' });
    }

    try {
        const userRef = admin.firestore().collection('users').doc(uid);

        // Use dot notation to update the map field
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

// Get locations a specific friend has shared with the current user
const getSharedLocations = async (req, res) => {
    const { uid } = req.user; // The user requesting the locations
    const { friendUid } = req.params; // The friend whose shared locations we want to see

    if (!friendUid) {
        return res.status(400).json({ error: 'Missing friendUid parameter' });
    }

    try {
        // Fetch the current user's document to find what the friend has shared with them
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Current user not found' });
        }

        const userData = userDoc.data();
        const sharedLocationsMap = userData.sharedLocations || {};

        // Get the array of locations the friend has shared with the current user
        const locationsFromFriend = sharedLocationsMap[friendUid] || [];

        res.status(200).json({ sharedLocation: locationsFromFriend });
    } catch (error) {
        console.error('Error fetching shared locations:', error);
        res.status(500).json({ error: 'Failed to fetch shared locations' });
    }
};

// Stop sharing a location with a specific friend
const removeSharedLocation = async (req, res) => {
    const { uid } = req.user; // The user who is sharing
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
