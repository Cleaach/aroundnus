// Mock the admin object from ../config/firebase
jest.mock('../config/firebase', () => {
    // Create mock functions for the methods you use
    const authMock = {
        createUser: jest.fn(),
        verifyIdToken: jest.fn(),
    };
    const firestoreMock = {
        collection: jest.fn(() => ({
            doc: jest.fn(() => ({
                get: jest.fn(),
                set: jest.fn(),
            })),
        })),
    };
    return {
        admin: {
            auth: () => authMock,
            firestore: () => firestoreMock,
        },
    };
});

const { registerUser, loginUser, verifyToken, initUserDoc } = require('../controllers/authController');

describe('registerUser', () => {
    it('should return 400 if email or password is missing', async () => {
        const req = { body: { email: '', password: '' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email and password required' });
    });

    it('should create a user with the correct email and password', async () => {
        const { admin } = require('../config/firebase');
        admin.auth().createUser.mockResolvedValue({
            uid: '1234567890',
            email: 'test@example.com',
            displayName: 'Test User'
        });
        const req = { body: { email: 'test@example.com', password: 'password', displayName: 'Test User', uid: '1234567890' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User created successfully',
            uid: '1234567890',
            email: 'test@example.com',
            displayName: 'Test User'
        });
    });

    it('should return 400 if user creation fails', async () => {
        const { admin } = require('../config/firebase');
        admin.auth().createUser.mockRejectedValue(new Error('User creation failed'));

        const req = { body: { email: 'test@example.com', password: 'password', displayName: 'Test User', uid: '1234567890' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User creation failed' });
    });
});


describe('loginUser', () => {
    it('should return 400 regardless as login is handled on the client', async () => {
        const req = { body: { email: 'test@example.com', password: 'password' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Login should be handled on the client using Firebase Auth SDK. Send the ID token to the backend for verification.' });
    });
});


describe('verifyToken', () => {
    it('should return 401 if no token is provided', async () => {
        const req = { headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        const { admin } = require('../config/firebase');
        admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

        const req = { headers: { authorization: 'Bearer invalidtoken' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid', async () => {
        const { admin } = require('../config/firebase');
        const decodedToken = { uid: '123', email: 'test@example.com' };
        admin.auth().verifyIdToken.mockResolvedValue(decodedToken);

        const req = { headers: { authorization: 'Bearer validtoken' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await verifyToken(req, res, next);

        expect(req.user).toEqual(decodedToken);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe('initUserDoc', () => {
    it('should return 201 if user document is created', async () => {
        const { admin } = require('../config/firebase');
        const userTemplate = {
            bookmarkedLocations: [],
            email: 'test@example.com',
            friendRequests: {
                received: [],
                sent: [],
            },
            friends: [],
            sharedLocation: [],
            displayName: 'Test User',
        };

        const docMock = {
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn().mockResolvedValue(),
        }

        const collectionMock = {
            doc: jest.fn().mockReturnValue(docMock),
        }

        admin.firestore().collection = jest.fn().mockReturnValue(collectionMock);

        const req = { user: { uid: '123', email: 'test@example.com' }, body: { displayName: 'Test User' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await initUserDoc(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "User document created", user: userTemplate
        });
        expect(docMock.set).toHaveBeenCalledWith(userTemplate);
    });

    it('should return 200 if user document already exists', async () => {
        const { admin } = require('../config/firebase');
        const docMock = {
            get: jest.fn().mockResolvedValue({ exists: true }),
            set: jest.fn().mockResolvedValue(),
        }
        const collectionMock = {
            doc: jest.fn().mockReturnValue(docMock),
        }

        admin.firestore().collection = jest.fn().mockReturnValue(collectionMock);

        const req = { user: { uid: '123', email: 'test@example.com' }, body: { displayName: 'Test User' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await initUserDoc(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(docMock.set).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ message: "User document already exists" });
    })

    it('should return 500 if an error occurs', async () => {
        const { admin } = require('../config/firebase');
        const docMock = {
            get: jest.fn().mockRejectedValue(new Error('Error')),
            set: jest.fn().mockResolvedValue(),
        }
        const collectionMock = {
            doc: jest.fn().mockReturnValue(docMock),
        }
        admin.firestore().collection = jest.fn().mockReturnValue(collectionMock);

        const req = { user: { uid: '123', email: 'test@example.com' }, body: { displayName: 'Test User' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await initUserDoc(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Error' });
    });
});