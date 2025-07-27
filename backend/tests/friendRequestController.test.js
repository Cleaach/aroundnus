const {
    sendFriendRequest,
    getReceivedFriendRequests,
    getSentFriendRequests,
    approveFriendRequest,
    rejectFriendRequest,
    removeFriend,
} = require('../controllers/friendRequestController');
const { admin } = require('../config/firebase');

jest.mock('../config/firebase');

describe('Friend Request Controller', () => {
    let req, res;
    let userDoc, targetUserDoc, mockCollection, mockFirestore;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { uid: 'user1' }, body: {}, query: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        userDoc = { get: jest.fn(), update: jest.fn() };
        targetUserDoc = { get: jest.fn(), update: jest.fn() };

        mockCollection = {
            doc: jest.fn().mockImplementation(id => {
                if (id === 'user1') return userDoc;
                if (id === 'user2') return targetUserDoc;
                return { get: jest.fn(), update: jest.fn() };
            }),
        };
        mockFirestore = { collection: jest.fn().mockReturnValue(mockCollection) };

        admin.firestore = jest.fn().mockReturnValue(mockFirestore);
        admin.firestore.FieldValue = {
            arrayUnion: jest.fn(val => `arrayUnion(${val})`),
            arrayRemove: jest.fn(val => `arrayRemove(${val})`),
        };
    });

    describe('sendFriendRequest', () => {
        beforeEach(() => {
            req.body.targetUid = 'user2';
        });

        it('should send a friend request successfully', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friends: [], friendRequests: { sent: [] } }) });
            targetUserDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if target user not found', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friends: [], friendRequests: { sent: [] } }) });
            targetUserDoc.get.mockResolvedValue({ exists: false, data: () => undefined }); // Add data method to mock
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 if already friends', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friends: ['user2'], friendRequests: { sent: [] } }) });
            targetUserDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if request already sent', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friends: [], friendRequests: { sent: ['user2'] } }) });
            targetUserDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getReceivedFriendRequests', () => {
        it('should get received friend requests', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friendRequests: { received: ['user2', 'user3'] } }) });
            await getReceivedFriendRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ received: ['user2', 'user3'] });
        });
    });

    describe('getSentFriendRequests', () => {
        it('should get sent friend requests', async () => {
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({ friendRequests: { sent: ['user2', 'user3'] } }) });
            await getSentFriendRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ sent: ['user2', 'user3'] });
        });
    });

    describe('approveFriendRequest', () => {
        it('should approve a friend request', async () => {
            req.body.requesterUid = 'user2';
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            targetUserDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await approveFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('rejectFriendRequest', () => {
        it('should reject a friend request', async () => {
            req.body.requesterUid = 'user2';
            userDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            targetUserDoc.get.mockResolvedValue({ exists: true, data: () => ({}) });
            await rejectFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('removeFriend', () => {
        it('should remove a friend', async () => {
            req.body.friendUid = 'user2';
            await removeFriend(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});