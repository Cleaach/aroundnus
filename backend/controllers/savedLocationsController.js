const { admin } = require('../config/firebase');


getSavedLocations = async (req, res) => {
    const { uid } = req.user;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const savedLocations = userData.savedLocations || [];
    res.json(savedLocations);
}

addSavedLocation = async (req, res) => {
    const { uid } = req.user;

    console.log(req)
    res.json({ message: "addSavedLocation" });
}

deleteSavedLocation = async (req, res) => {
    console.log(req)
    res.json({ message: "deleteSavedLocation" });
}


// exports the functions so that they can be used

module.exports = {
    getSavedLocations,
    addSavedLocation,
    deleteSavedLocation,
}
