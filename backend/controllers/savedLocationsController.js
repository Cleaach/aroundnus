const { admin } = require('../config/firebase');


getSavedLocations = async (req, res) => {
    const { uid } = req.user;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const savedLocations = userData.savedLocations || [];
    res.status(200).json(savedLocations);
}

addSavedLocation = async (req, res) => {
    const { uid } = req.user;
    const { location } = req.body;
 
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const savedLocations = userData.savedLocations || [];

    savedLocations.push(location);

    await admin.firestore().collection('users').doc(uid).update({ savedLocations });
    res.status(200).json({ message: "Location added to saved locations" });
}

deleteSavedLocation = async (req, res) => {
    const { uid } = req.user;
    const { location } = req.body;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const savedLocations = userData.savedLocations || [];

    const newSavedLocations = savedLocations.filter(loc => loc.id !== location.id);

    await admin.firestore().collection('users').doc(uid).update({ savedLocations: newSavedLocations });
    res.status(200).json({ message: "Location deleted from saved locations" });
}

// exports the functions so that they can be used

module.exports = {
    getSavedLocations,
    addSavedLocation,
    deleteSavedLocation,
}
