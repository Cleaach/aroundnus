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

    console.log(req)
    res.status(200).json({ message: "addSavedLocation" });
}

deleteSavedLocation = async (req, res) => {
    console.log(req)
    res.status(200).json({ message: "deleteSavedLocation" });
}


// exports the functions so that they can be used

module.exports = {
    getSavedLocations,
    addSavedLocation,
    deleteSavedLocation,
}
