const { shareLocation, getSharedLocations, removeSharedLocation } = require('../controllers/sharedLocationController');
const { admin } = require('../config/firebase');

// Mock Firestore
jest.mock('../config/firebase', () => {
  const FieldValue = {
    arrayUnion: jest.fn((elements) => ({
      _method: 'arrayUnion',
      _elements: elements
    })),
    arrayRemove: jest.fn((elements) => ({
      _method: 'arrayRemove',
      _elements: elements
    })),
    serverTimestamp: jest.fn(() => ({
      _method: 'serverTimestamp'
    }))
  };

  return {
    admin: {
      firestore: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(),
          add: jest.fn()
        })),
        batch: jest.fn(() => ({
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          commit: jest.fn()
        })),
        FieldValue
      })),
      FieldValue
    }
  };
});

describe('Shared Locations Controller', () => {
  let req, res, next;
  const mockLocationId = 'loc123';
  const mockUserId = 'user123';
  const mockFriendIds = ['friend1', 'friend2'];
  const mockSharedLocation = {
    id: 'share123',
    locationId: mockLocationId,
    sharedBy: mockUserId,
    sharedAt: new Date(),
    note: 'Check this out!',
    status: 'unread'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      user: { uid: mockUserId },
      body: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('shareLocation', () => {
    beforeEach(() => {
      req.body = {
        locationId: mockLocationId,
        friendIds: mockFriendIds,
        note: 'Check this out!'
      };
    });

    it('should successfully share a location with friends', async () => {
      // Mock Firestore batch operations
      const batchMock = admin.firestore().batch();
      batchMock.commit.mockResolvedValue();
      
      // Mock document references
      const sharedLocationRef = { id: 'share123' };
      const userRef = {};
      const friendRefs = mockFriendIds.map(id => ({
        get: jest.fn().mockResolvedValue({ exists: true }),
        update: jest.fn()
      }));
      
      // Mock Firestore collection and document methods
      const collectionMock = admin.firestore().collection;
      const docMock = jest.fn()
        .mockReturnValueOnce({ add: jest.fn().mockResolvedValue(sharedLocationRef) }) // sharedLocations collection
        .mockReturnValueOnce(userRef) // users collection (sharer)
        .mockReturnValueOnce(friendRefs[0]) // first friend
        .mockReturnValueOnce(friendRefs[1]); // second friend
      
      collectionMock.mockReturnValue({ doc: docMock });
      
      await shareLocation(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Location shared successfully',
        sharedLocationId: sharedLocationRef.id
      });
      
      // Verify batch operations
      expect(batchMock.commit).toHaveBeenCalled();
    });

    it('should return 400 if locationId is missing', async () => {
      delete req.body.locationId;
      await shareLocation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if friendIds is missing or empty', async () => {
      req.body.friendIds = [];
      await shareLocation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSharedLocations', () => {
    it('should retrieve shared locations for the current user', async () => {
      // Mock user document with shared locations
      const mockSharedLocations = [
        { 
          id: 'share1',
          locationId: 'loc1',
          sharedBy: 'friend1',
          sharedAt: new Date(),
          note: 'Check this out!',
          status: 'unread'
        }
      ];
      
      // Mock location data
      const mockLocationData = {
        name: 'Test Location',
        address: '123 Test St',
        coordinates: { lat: 1.2345, lng: 2.3456 }
      };
      
      // Mock user data for the sharer
      const mockSharerData = {
        displayName: 'Test Friend',
        profilePicture: 'profile.jpg'
      };
      
      // Mock Firestore document gets
      const userDoc = {
        exists: true,
        data: jest.fn().mockReturnValue({
          sharedLocations: mockSharedLocations
        })
      };
      
      const locationDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockLocationData)
      };
      
      const sharerDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockSharerData)
      };
      
      // Mock Firestore collection and document methods
      const docMock = jest.fn()
        .mockImplementation((path) => {
          if (path === mockUserId) return { get: jest.fn().mockResolvedValue(userDoc) };
          if (path === 'loc1') return { get: jest.fn().mockResolvedValue(locationDoc) };
          if (path === 'friend1') return { get: jest.fn().mockResolvedValue(sharerDoc) };
          return { get: jest.fn().mockResolvedValue({ exists: false }) };
        });
      
      admin.firestore().collection.mockImplementation(() => ({
        doc: docMock
      }));
      
      await getSharedLocations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(Array.isArray(res.json.mock.calls[0][0])).toBe(true);
      expect(res.json.mock.calls[0][0][0]).toMatchObject({
        id: 'share1',
        location: mockLocationData,
        sharedBy: {
          ...mockSharerData,
          uid: 'friend1'
        },
        note: 'Check this out!',
        status: 'unread'
      });
    });
  });

  describe('removeSharedLocation', () => {
    beforeEach(() => {
      req.params = { sharedLocationId: 'share123' };
    });

    it('should remove a shared location', async () => {
      // Mock Firestore document delete
      const deleteMock = jest.fn().mockResolvedValue();
      const docMock = {
        delete: deleteMock
      };
      
      admin.firestore().collection.mockImplementation(() => ({
        doc: jest.fn().mockReturnValue(docMock)
      }));
      
      await removeSharedLocation(req, res);
      
      expect(deleteMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Shared location removed'
      });
    });
  });
});
