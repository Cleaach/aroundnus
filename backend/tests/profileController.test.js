const {
    getProfileData,
    updateDisplayName,
    getProfileDataByUid,
    updateProfilePicture,
} = require('../controllers/profileController');
const { admin } = require('../config/firebase');

jest.mock('../config/firebase');

describe('Profile Controller', () => {
    let req, res;
    let mockDoc, mockCollection, mockFirestore, mockFile, mockBucket, mockStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { uid: 'user1' }, body: {}, query: {}, file: null };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };

        // Mock Firestore
        mockDoc = { get: jest.fn(), update: jest.fn(), set: jest.fn(), delete: jest.fn() };
        mockCollection = { doc: jest.fn().mockReturnValue(mockDoc) };
        mockFirestore = { collection: jest.fn().mockReturnValue(mockCollection), runTransaction: jest.fn() };

        // Mock Storage
        mockFile = {
            save: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
            getSignedUrl: jest.fn().mockResolvedValue(['http://fake-url.com'])
        };
        mockBucket = { file: jest.fn().mockReturnValue(mockFile), name: 'test-bucket' };
        mockStorage = { bucket: jest.fn().mockReturnValue(mockBucket) };

        admin.firestore = jest.fn().mockReturnValue(mockFirestore);
        admin.storage = jest.fn().mockReturnValue(mockStorage);
    });

    describe('getProfileData', () => {
        it('should get profile data', async () => {
            const userData = { email: 'a@a.com', displayName: 'Test' };
            mockDoc.get.mockResolvedValue({ exists: true, data: () => userData });
            await getProfileData(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining(userData));
        });
    });

    describe('updateDisplayName', () => {
        it('should update display name', async () => {
            req.body.displayName = 'New Name';
            mockFirestore.runTransaction.mockImplementation(async (updateFunction) => {
                const transaction = {
                    get: jest.fn().mockResolvedValue({ exists: false }),
                    update: jest.fn(),
                    set: jest.fn(),
                    delete: jest.fn(),
                };
                transaction.get.mockResolvedValueOnce({ exists: true, data: () => ({ displayName: 'Old Name' }) });
                await updateFunction(transaction);
            });
            await updateDisplayName(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateProfilePicture', () => {
        it('should update profile picture', async () => {
            req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' };
            mockDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await updateProfilePicture(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile picture updated successfully' }));
        });
    });

    describe('getProfileDataByUid', () => {
        it('should get profile data by UID', async () => {
            req.query.uid = 'user2';
            const userData = { displayName: 'Friend', profilePicture: 'url' };
            mockDoc.get.mockResolvedValue({ exists: true, data: () => userData });
            await getProfileDataByUid(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(userData);
        });
    });
});
