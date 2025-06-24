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

const { verifyToken } = require('../middleware/authMiddleware');

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