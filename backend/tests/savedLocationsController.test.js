jest.mock('../config/firebase', () => {
    return {
        admin: {
            firestore: jest.fn(),
        }
    }
});

const { getSavedLocations, addSavedLocation, deleteSavedLocation } = require('../controllers/savedLocationsController');

describe('getSavedLocations', () => {
    it('should return saved locations', async () => {
        const req = {
            user: {
                uid: 'test-uid',
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const docMock = {
            get: jest.fn().mockResolvedValue({
                data: () => ({ savedLocations: ['location1', 'location2'] }),
            }),
        };

        const collectionMock = { doc: jest.fn().mockReturnValue(docMock) };

        const { admin } = require('../config/firebase');

        admin.firestore.mockReturnValue({ collection: jest.fn().mockReturnValue(collectionMock) });

        await getSavedLocations(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(['location1', 'location2']);
    });
});

describe('addSavedLocation', () => {
    it('should add a saved location', async () => {
        const req = {
            user: { uid: 'test-uid' },
            body: { location: { id: '123', name: 'Test Location' } },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock Firestore chain
        const savedLocations = [];
        const docMock = {
            get: jest.fn().mockResolvedValue({
                data: () => ({ savedLocations }),
            }),
            update: jest.fn().mockResolvedValue(),
        };
        const collectionMock = { doc: jest.fn().mockReturnValue(docMock) };
        const { admin } = require('../config/firebase');
        admin.firestore.mockReturnValue({ collection: jest.fn().mockReturnValue(collectionMock) });

        await addSavedLocation(req, res);

        expect(docMock.update).toHaveBeenCalledWith({ savedLocations: [req.body.location] });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Location added to saved locations" });
    });
});

describe('deleteSavedLocation', () => {
    it('should delete a saved location', async () => {
        const req = {
            user: { uid: 'test-uid' },
            body: { location: { id: '123', name: 'Test Location' } },
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        // Mock Firestore chain
        const savedLocations = [{ id: '123', name: 'Test Location' }, { id: '456', name: 'Other Location' }];
        const docMock = {
            get: jest.fn().mockResolvedValue({
                data: () => ({ savedLocations }),
            }),
            update: jest.fn().mockResolvedValue(),
        };
        const collectionMock = { doc: jest.fn().mockReturnValue(docMock) };
        const { admin } = require('../config/firebase');
        admin.firestore.mockReturnValue({ collection: jest.fn().mockReturnValue(collectionMock) });

        await deleteSavedLocation(req, res);

        expect(docMock.update).toHaveBeenCalledWith({ savedLocations: [{ id: '456', name: 'Other Location' }] });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Location deleted from saved locations" });
    });
});

