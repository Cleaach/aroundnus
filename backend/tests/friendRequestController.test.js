const { sendFriendRequest, getReceivedFriendRequests, getSentFriendRequests, approveFriendRequest, rejectFriendRequest } = require('../controllers/friendRequestController');
const { admin } = require('../config/firebase');

jest.mock('../config/firebase', () => {
    const FieldValue = {
        arrayUnion: jest.fn((v) => v),
        arrayRemove: jest.fn((v) => v),
    };
    return {
        admin: {
            firestore: jest.fn().mockReturnThis(),
            FieldValue,
            collection: jest.fn(),
            auth: jest.fn(),
        },
    };
});

describe('Friend Request Controller', () => {
    let req, res, userDoc, targetDoc, userRef, targetRef;

    beforeEach(() => {
        req = { user: { uid: 'user1' }, body: {}, headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        userDoc = { exists: true, data: jest.fn() };
        targetDoc = { exists: true, data: jest.fn() };
        userRef = { get: jest.fn(), update: jest.fn() };
        targetRef = { get: jest.fn(), update: jest.fn() };
        admin.firestore.mockReturnValue({
            collection: jest.fn((col) => ({
                doc: jest.fn((uid) => (uid === 'user1' ? userRef : targetRef)),
            })),
        });
        userRef.get.mockResolvedValue(userDoc);
        targetRef.get.mockResolvedValue(targetDoc);
    });

    describe('sendFriendRequest', () => {
        it('should send a friend request', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [] } });
            targetDoc.exists = true;
            await sendFriendRequest(req, res);
            expect(userRef.update).toHaveBeenCalledWith({ 'friendRequests.sent': 'user2' });
            expect(targetRef.update).toHaveBeenCalledWith({ 'friendRequests.received': 'user1' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Friend request sent' });
        });
        it('should not allow sending to self', async () => {
            req.body.targetUid = 'user1';
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should not allow sending to non-existent user', async () => {
            req.body.targetUid = 'user2';
            targetDoc.exists = false;
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should not allow sending if already friends', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: ['user2'], friendRequests: { sent: [] } });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should not allow sending if already sent', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: ['user2'] } });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getReceivedFriendRequests', () => {
        it('should return received friend requests', async () => {
            userDoc.data.mockReturnValue({ friendRequests: { received: ['user2'] } });
            await getReceivedFriendRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ received: ['user2'] });
        });
    });

    describe('getSentFriendRequests', () => {
        it('should return sent friend requests', async () => {
            userDoc.data.mockReturnValue({ friendRequests: { sent: ['user3'] } });
            await getSentFriendRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ sent: ['user3'] });
        });
    });

    describe('approveFriendRequest', () => {
        beforeEach(() => {
            req.body.requesterUid = 'user2';
        });
        it('should approve a friend request', async () => {
            userDoc.data.mockReturnValue({});
            targetDoc.exists = true;
            await approveFriendRequest(req, res);
            expect(userRef.update).toHaveBeenCalledWith({
                'friendRequests.received': 'user2',
                friends: 'user2',
            });
            expect(targetRef.update).toHaveBeenCalledWith({
                'friendRequests.sent': 'user1',
                friends: 'user1',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Friend request approved' });
        });
        it('should not approve if requester not found', async () => {
            targetDoc.exists = false;
            await approveFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should not approve if no requesterUid', async () => {
            req.body.requesterUid = undefined;
            await approveFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('rejectFriendRequest', () => {
        beforeEach(() => {
            req.body.requesterUid = 'user2';
        });
        it('should reject a friend request', async () => {
            await rejectFriendRequest(req, res);
            expect(userRef.update).toHaveBeenCalledWith({ 'friendRequests.received': 'user2' });
            expect(targetRef.update).toHaveBeenCalledWith({ 'friendRequests.sent': 'user1' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Friend request rejected' });
        });
        it('should not reject if no requesterUid', async () => {
            req.body.requesterUid = undefined;
            await rejectFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
}); 