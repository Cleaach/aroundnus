const { 
    sendFriendRequest, 
    getReceivedFriendRequests, 
    getSentFriendRequests, 
    approveFriendRequest, 
    rejectFriendRequest 
} = require('../controllers/friendRequestController');

// Mock Firebase Admin
const mockFirestore = {
    collection: jest.fn().mockImplementation((collectionName) => {
        console.log(`[MOCK] collection('${collectionName}') called`);
        return {
            doc: jest.fn().mockImplementation((docId) => {
                console.log(`[MOCK] collection('${collectionName}').doc('${docId}') called`);
                // Default return for doc()
                return {
                    get: jest.fn().mockResolvedValue({
                        exists: false,
                        data: () => ({})
                    }),
                    update: jest.fn().mockResolvedValue()
                };
            })
        };
    }),
    FieldValue: {
        arrayUnion: (...elements) => {
            console.log(`[MOCK] FieldValue.arrayUnion(${JSON.stringify(elements)})`);
            return {
                _method: 'ARRAY_UNION',
                _elements: elements
            };
        },
        arrayRemove: (...elements) => {
            console.log(`[MOCK] FieldValue.arrayRemove(${JSON.stringify(elements)})`);
            return {
                _method: 'ARRAY_REMOVE',
                _elements: elements
            };
        }
    }
};

// Mock the Firebase admin module
jest.mock('../config/firebase', () => ({
    admin: {
        firestore: jest.fn(() => {
            console.log('[MOCK] admin.firestore() called');
            return mockFirestore;
        })
    }
}));

const { admin } = require('../config/firebase');

describe('Friend Request Controller', () => {
    let req, res, userDoc, targetDoc, userRef, targetRef;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup request and response objects
        req = { 
            user: { uid: 'user1' }, 
            body: {}, 
            query: {} 
        };
        res = { 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn() 
        };

        // Setup mock document data
        userDoc = { 
            exists: true, 
            data: jest.fn() 
        };
        
        targetDoc = { 
            exists: true, 
            data: jest.fn() 
        };

        // Setup mock document references
        userRef = { 
            get: jest.fn().mockResolvedValue(userDoc),
            update: jest.fn().mockResolvedValue()
        };
        
        targetRef = { 
            get: jest.fn().mockResolvedValue(targetDoc),
            update: jest.fn().mockResolvedValue()
        };

        // Setup Firestore mock
        mockFirestore.collection.mockImplementation(() => ({
            doc: (uid) => {
                if (uid === 'user1') return userRef;
                if (uid === 'user2') return targetRef;
                return { 
                    get: jest.fn().mockResolvedValue({ exists: false }),
                    update: jest.fn().mockResolvedValue()
                };
            }
        }));
    });

    describe('sendFriendRequest', () => {
        it('should send a friend request', async () => {
            // Setup test data
            req.body.targetUid = 'user2';
            const userData = { 
                friends: [], 
                friendRequests: { 
                    sent: [], 
                    received: [] 
                } 
            };
            const targetData = { 
                friends: [], 
                friendRequests: { 
                    sent: [], 
                    received: [] 
                } 
            };
            
            // Mock the data methods
            userDoc.data.mockImplementation(() => ({ ...userData }));
            targetDoc.data.mockImplementation(() => ({ ...targetData }));
            targetDoc.exists = true;

            // Execute the function
            await sendFriendRequest(req, res);

            // Debug logs
            console.log('=== Debug: sendFriendRequest test ===');
            console.log('userRef.update calls:', JSON.stringify(userRef.update.mock.calls, null, 2));
            console.log('targetRef.update calls:', JSON.stringify(targetRef.update.mock.calls, null, 2));
            console.log('res.status calls:', res.status.mock.calls);
            console.log('res.json calls:', res.json.mock.calls);
            console.log('====================================');

            // Assertions - Check if update was called with the correct arguments
            expect(userRef.update).toHaveBeenCalled();
            expect(targetRef.update).toHaveBeenCalled();
            
            // Check response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Friend request sent' });
        });
        it('should not allow sending to self', async () => {
            req.body.targetUid = 'user1';
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: [] } });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should not allow sending to non-existent user', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: [] } });
            targetDoc.exists = false;
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should not allow sending if already friends', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: ['user2'], friendRequests: { sent: [], received: [] } });
            targetDoc.exists = true;
            targetDoc.data.mockReturnValue({ friends: ['user1'], friendRequests: { sent: [], received: [] } });
            await sendFriendRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
        it('should not allow sending if already sent', async () => {
            req.body.targetUid = 'user2';
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: ['user2'], received: [] } });
            targetDoc.exists = true;
            targetDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: [] } });
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
            // user has received a request from requester
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: ['user2'] } });
            targetDoc.exists = true;
            // requester has sent a request to user
            targetDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: ['user1'], received: [] } });
            await approveFriendRequest(req, res);
            // Log update calls for diagnosis
            console.log('userRef.update.mock.calls:', userRef.update.mock.calls);
            console.log('targetRef.update.mock.calls:', targetRef.update.mock.calls);
            expect(userRef.update).toHaveBeenCalledWith(expect.objectContaining({
                'friendRequests.received': expect.anything(),
                friends: expect.anything(),
            }));
            expect(targetRef.update).toHaveBeenCalledWith(expect.objectContaining({
                'friendRequests.sent': expect.anything(),
                friends: expect.anything(),
            }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Friend request approved' });
        });
        it('should not approve if requester not found', async () => {
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: ['user2'] } });
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
            // user has received a request from requester
            userDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: [], received: ['user2'] } });
            targetDoc.exists = true;
            // requester has sent a request to user
            targetDoc.data.mockReturnValue({ friends: [], friendRequests: { sent: ['user1'], received: [] } });
            await rejectFriendRequest(req, res);
            // Log update calls for diagnosis
            console.log('userRef.update.mock.calls:', userRef.update.mock.calls);
            console.log('targetRef.update.mock.calls:', targetRef.update.mock.calls);
            expect(userRef.update).toHaveBeenCalledWith(expect.objectContaining({ 'friendRequests.received': expect.anything() }));
            expect(targetRef.update).toHaveBeenCalledWith(expect.objectContaining({ 'friendRequests.sent': expect.anything() }));
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