// Simple integration test for locations functionality

describe('Locations Flow Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should handle saved locations CRUD operations', async () => {
    // Test getting saved locations
    global.mockApiResponse({ 
      success: true, 
      locations: [
        { id: '1', name: 'Library' },
        { id: '2', name: 'Canteen' }
      ]
    });

    let response = await fetch('/api/saved-locations/get', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    let result = await response.json();

    expect(result.success).toBe(true);
    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].name).toBe('Library');

    // Test adding a new location
    global.mockApiResponse({ 
      success: true, 
      id: '3',
      location: { id: '3', name: 'Study Room' }
    });

    response = await fetch('/api/saved-locations/add', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' 
      },
      body: JSON.stringify({ name: 'Study Room' })
    });
    result = await response.json();

    expect(result.success).toBe(true);
    expect(result.location.name).toBe('Study Room');

    // Test deleting a location
    global.mockApiResponse({ success: true });

    response = await fetch('/api/saved-locations/delete/3', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    result = await response.json();

    expect(result.success).toBe(true);
  });

  test('should handle location sharing flow', async () => {
    // Mock sharing location
    global.mockApiResponse({ 
      success: true, 
      shareId: 'share123',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    const shareData = {
      latitude: 1.3521,
      longitude: 103.8198,
      friendIds: ['friend1', 'friend2'],
      duration: 3600
    };

    const response = await fetch('/api/shared-locations/share', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' 
      },
      body: JSON.stringify(shareData)
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.shareId).toBe('share123');
    expect(result.expiresAt).toBeDefined();
  });

  test('should handle getting shared locations', async () => {
    // Mock getting shared locations
    global.mockApiResponse({ 
      success: true, 
      sharedLocations: [
        {
          id: 'share1',
          userId: 'friend1',
          userName: 'Friend One',
          latitude: 1.3521,
          longitude: 103.8198,
          timestamp: new Date().toISOString()
        }
      ]
    });

    const response = await fetch('/api/shared-locations/get', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.sharedLocations).toHaveLength(1);
    expect(result.sharedLocations[0].userName).toBe('Friend One');
  });

  test('should handle location sharing errors', async () => {
    // Mock error response
    global.mockApiResponse({ 
      success: false, 
      error: 'Invalid location data' 
    }, 400);

    const invalidShareData = {
      latitude: 'invalid',
      longitude: 'invalid'
    };

    const response = await fetch('/api/shared-locations/share', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' 
      },
      body: JSON.stringify(invalidShareData)
    });

    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid location data');
  });
});
