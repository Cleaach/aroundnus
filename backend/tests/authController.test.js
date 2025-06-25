jest.mock('../config/firebase', () => {
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

const { registerUser, loginUser, initUserDoc } = require('../controllers/authController');

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