const {
    shareLocation,
    getSharedLocations,
    removeSharedLocation,
} = require('../controllers/sharedLocationController');
const { admin } = require('../config/firebase');

jest.mock('../config/firebase');

describe('Shared Locations Controller', () => {
    let req, res;
    let userDoc, friendDoc, mockCollection, mockFirestore;
    const mockUserId = 'user123';
    const mockFriendId = 'friend123';

    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { uid: mockUserId }, body: {}, params: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        userDoc = { get: jest.fn(), update: jest.fn().mockResolvedValue() };
        friendDoc = { get: jest.fn(), update: jest.fn() };

        mockCollection = {
            doc: jest.fn(id => {
                if (id === mockUserId) return userDoc;
                if (id === mockFriendId) return friendDoc;
                return { get: jest.fn(), update: jest.fn() };
            }),
        };
        mockFirestore = { collection: jest.fn(() => mockCollection) };

        admin.firestore = jest.fn(() => mockFirestore);
        admin.firestore.FieldValue = {
            arrayUnion: jest.fn(val => `arrayUnion(${JSON.stringify(val)})`),
            arrayRemove: jest.fn(val => `arrayRemove(${JSON.stringify(val)})`),
        };
    });

    describe('shareLocation', () => {
        it('should share a location successfully', async () => {
            req.body = { friendUid: mockFriendId, locationName: 'Test Location' };
            await shareLocation(req, res);
            expect(userDoc.update).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if friendUid or locationName is missing', async () => {
            req.body = { locationName: 'Test Location' }; // Missing friendUid
            await shareLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getSharedLocations', () => {
        beforeEach(() => {
            req.params = { friendUid: mockFriendId };
        });

        it('should get shared locations successfully', async () => {
            const mockLocations = [{ locationId: '1', locationName: 'Friend Location' }];
            friendDoc.get.mockResolvedValue({
                exists: true,
                data: () => ({ sharedLocations: { [mockUserId]: mockLocations } }),
            });
            await getSharedLocations(req, res);
            expect(friendDoc.get).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockLocations);
        });

        it('should return 404 if friend not found', async () => {
            friendDoc.get.mockResolvedValue({ exists: false });
            await getSharedLocations(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('removeSharedLocation', () => {
        it('should remove a shared location successfully', async () => {
            req.body = { friendUid: mockFriendId, locationName: 'Test Location' };
            await removeSharedLocation(req, res);
            expect(userDoc.update).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
