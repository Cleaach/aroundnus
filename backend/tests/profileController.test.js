const { getProfileData, updateDisplayName, getProfileDataByUid, updateProfilePicture } = require('../controllers/profileController');
const { admin } = require('../config/firebase');

jest.mock('../config/firebase', () => {
    const FieldValue = {
        arrayUnion: jest.fn((v) => v),
        arrayRemove: jest.fn((v) => v),
    };
    const update = jest.fn();
    const set = jest.fn();
    const get = jest.fn();
    const doc = jest.fn(() => ({ get, update, set }));
    const collection = jest.fn(() => ({ doc }));
    const runTransaction = jest.fn((fn) => fn({
        get: get,
        update: update,
        set: set,
        delete: jest.fn(),
    }));
    const firestore = jest.fn(() => ({ collection, runTransaction }));
    const storage = jest.fn(() => ({ bucket: jest.fn(() => ({ file: jest.fn(() => ({ save: jest.fn(), delete: jest.fn() })) })) }));
    return {
        admin: {
            firestore,
            storage,
            FieldValue,
        },
    };
});

describe('profileController', () => {
    let req, res, userDoc, userRef, token;

    beforeEach(() => {
        req = { user: { uid: 'user1' }, body: {}, query: {}, file: { buffer: Buffer.from(''), mimetype: 'image/jpeg' } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        userDoc = { exists: true, data: jest.fn() };
        userRef = { get: jest.fn().mockResolvedValue(userDoc), update: jest.fn(), set: jest.fn() };
        token = 'token';
        admin.firestore().collection.mockReturnValue({ doc: jest.fn(() => userRef) });
        admin.firestore().runTransaction.mockImplementation(async (fn) => fn({
            get: userRef.get,
            update: userRef.update,
            set: userRef.set,
            delete: jest.fn(),
        }));
    });

    describe('getProfileData', () => {
        it('should return profile data', async () => {
            userDoc.data.mockReturnValue({ email: 'test@example.com', profilePicture: 'url', displayName: 'Test', friends: ['f1'] });
            await getProfileData(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ email: 'test@example.com', profilePicture: 'url', displayName: 'Test', friends: ['f1'] });
        });
        it('should return 404 if user not found', async () => {
            userDoc.exists = false;
            await getProfileData(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should handle errors', async () => {
            userRef.get.mockRejectedValue(new Error('fail'));
            await getProfileData(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getProfileDataByUid', () => {
        it('should return displayName and profilePicture', async () => {
            req.query.uid = 'user1';
            userDoc.data.mockReturnValue({ displayName: 'Test', profilePicture: 'url' });
            await getProfileDataByUid(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ displayName: 'Test', profilePicture: 'url' });
        });
        it('should return 404 if user not found', async () => {
            req.query.uid = 'user1';
            userDoc.exists = false;
            await getProfileDataByUid(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should handle errors', async () => {
            req.query.uid = 'user1';
            userRef.get.mockRejectedValue(new Error('fail'));
            await getProfileDataByUid(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateDisplayName', () => {
        it('should update display name if unique', async () => {
            userDoc.exists = true;
            userDoc.data.mockReturnValue({ displayName: 'OldName' });
            req.body.displayName = 'NewName';
            // Create a mock displayNameIndexRef
            const displayNameIndexRef = { id: 'newname' };
            // Patch the controller to use our mock displayNameIndexRef
            const db = admin.firestore();
            db.collection.mockImplementation((col) => {
                if (col === 'displayNameIndex') return { doc: jest.fn(() => displayNameIndexRef) };
                if (col === 'users') return { doc: jest.fn(() => userRef) };
                return { doc: jest.fn() };
            });
            admin.firestore().runTransaction.mockImplementationOnce(async (fn) => {
                await fn({
                    get: async (ref) => {
                        if (ref === displayNameIndexRef) {
                            return { exists: false };
                        }
                        if (ref === userRef) {
                            return userDoc;
                        }
                        return { exists: false };
                    },
                    update: jest.fn(),
                    set: jest.fn(),
                    delete: jest.fn(),
                });
            });
            await updateDisplayName(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Display name updated', displayName: 'NewName' });
        });
        it('should return 409 if display name taken', async () => {
            userDoc.exists = true;
            userDoc.data.mockReturnValue({ displayName: 'OldName' });
            req.body.displayName = 'TakenName';
            // Simulate transaction throwing error
            admin.firestore().runTransaction.mockImplementationOnce(async () => { throw new Error('Display name already taken'); });
            await updateDisplayName(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });
        it('should return 404 if user not found', async () => {
            userDoc.exists = false;
            req.body.displayName = 'NewName';
            admin.firestore().runTransaction.mockImplementationOnce(async () => { throw new Error('User not found'); });
            await updateDisplayName(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should handle errors', async () => {
            userDoc.exists = true;
            req.body.displayName = 'ErrName';
            admin.firestore().runTransaction.mockImplementationOnce(async () => { throw new Error('fail'); });
            await updateDisplayName(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // updateProfilePicture is not tested here due to file and storage mocking complexity
});
