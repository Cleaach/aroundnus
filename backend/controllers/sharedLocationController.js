const { admin } = require('../config/firebase');

// Share a location with friends
const shareLocation = async (req, res) => {
    const { uid } = req.user;
    const { locationId, friendUids, note } = req.body;

    if (!locationId || !friendUids || !Array.isArray(friendUids) || friendUids.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: locationId and friendUids are required' });
    }

    try {
        const batch = admin.firestore().batch();
        const sharedAt = admin.firestore.FieldValue.serverTimestamp();

        // Create a shared location document
        const sharedLocationRef = admin.firestore().collection('sharedLocation').doc();
        batch.set(sharedLocationRef, {
            locationId,
            sharedBy: uid,
            sharedWith: friendUids,
            note: note || '',
            sharedAt,
            status: 'active'
        });

        // Update each friend's sharedLocations array
        friendUids.forEach(friendUid => {
            const userRef = admin.firestore().collection('users').doc(friendUid);
            batch.update(userRef, {
                sharedLocation: admin.firestore.FieldValue.arrayUnion({
                    locationId,
                    sharedBy: uid,
                    sharedAt,
                    note: note || '',
                    status: 'unread'
                })
            });
        });

        await batch.commit();
        return res.status(200).json({
            message: 'Location shared successfully',
            sharedLocationId: sharedLocationRef.id
        });
    } catch (error) {
        console.error('Error sharing location:', error);
        return res.status(500).json({ error: 'Failed to share location' });
    }
};

// Get locations shared with the current user
const getSharedLocations = async (req, res) => {
    const { uid } = req.user;

    try {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const sharedLocations = userData.sharedLocation || [];

        // Get details for each shared location
        const locationsWithDetails = await Promise.all(
            sharedLocations.map(async (sharedLocation) => {
                const locationDoc = await admin.firestore()
                    .collection('locations')
                    .doc(sharedLocation.locationId)
                    .get();

                if (!locationDoc.exists) {
                    return null;
                }

                // Get user who shared the location
                const sharedByUserDoc = await admin.firestore()
                    .collection('users')
                    .doc(sharedLocation.sharedBy)
                    .get();

                return {
                    ...sharedLocation,
                    locationData: locationDoc.data(),
                    sharedByUser: {
                        uid: sharedByUserDoc.id,
                        displayName: sharedByUserDoc.data()?.displayName || 'Unknown User',
                        photoURL: sharedByUserDoc.data()?.photoURL
                    },
                    sharedAt: sharedLocation.sharedAt?.toDate()?.toISOString()
                };
            })
        );

        // Filter out any null values (from non-existent locations)
        const validLocations = locationsWithDetails.filter(loc => loc !== null);

        return res.status(200).json({ sharedLocation: validLocations });
    } catch (error) {
        console.error('Error fetching shared locations:', error);
        return res.status(500).json({ error: 'Failed to fetch shared locations' });
    }
};

// Remove a shared location
const removeSharedLocation = async (req, res) => {
    const { uid } = req.user;
    const { locationId, sharedBy } = req.body;

    if (!locationId || !sharedBy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const userRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const sharedLocations = userData.sharedLocation || [];

        // Filter out the location to be removed
        const updatedLocations = sharedLocations.filter(
            loc => !(loc.locationId === locationId && loc.sharedBy === sharedBy)
        );

        await userRef.update({ sharedLocation: updatedLocations });

        return res.status(200).json({
            message: 'Shared location removed successfully',
            locationId
        });
    } catch (error) {
        console.error('Error removing shared location:', error);
        return res.status(500).json({ error: 'Failed to remove shared location' });
    }
};

module.exports = {
    shareLocation,
    getSharedLocations,
    removeSharedLocation
};
