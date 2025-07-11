const { admin } = require('../config/firebase');


const getSavedLocations = async (req, res) => {
    const { uid } = req.user;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const bookmarkedLocations = userData.bookmarkedLocations || [];
    res.status(200).json(bookmarkedLocations);
}

const addSavedLocation = async (req, res) => {
    const { uid } = req.user;
    const { location } = req.body;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const bookmarkedLocations = userData.bookmarkedLocations || [];

    bookmarkedLocations.push(location);

    await admin.firestore().collection('users').doc(uid).update({ bookmarkedLocations: bookmarkedLocations });
    res.status(200).json({ message: "Location added to saved locations" });
}

const deleteSavedLocation = async (req, res) => {
    const { uid } = req.user;
    const { location } = req.body;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const bookmarkedLocations = userData.bookmarkedLocations || [];

    const newBookmarkedLocations = bookmarkedLocations.filter(loc => loc.id !== location.id);

    await admin.firestore().collection('users').doc(uid).update({ bookmarkedLocations: newBookmarkedLocations });
    res.status(200).json({ message: "Location deleted from saved locations" });
}

// exports the functions so that they can be used

module.exports = {
    getSavedLocations,
    addSavedLocation,
    deleteSavedLocation,
}
