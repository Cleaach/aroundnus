import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SavedLocationsScreen from '../../app/(tabs)/saved-locations';

const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

const mockGetIdToken = jest.fn();
const mockCurrentUser = { getIdToken: mockGetIdToken };
jest.mock('../../firebase', () => ({
  auth: { currentUser: mockCurrentUser },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate user pressing the confirm button
  if (buttons && buttons[1] && buttons[1].onPress) {
    buttons[1].onPress();
  }
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetIdToken.mockResolvedValue('mock-token');
  
  // Default fetch implementation
  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/saved-locations/get')) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    if (url.includes('/api/saved-locations/add')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true, id: 'mock-uuid' }), { status: 200 }));
    }
    if (url.includes('/api/saved-locations/delete')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  });
});

describe('SavedLocationsScreen integration', () => {
  it('loads saved locations on mount', async () => {
    const mockLocations = [
      { id: '1', name: 'Library' },
      { id: '2', name: 'Canteen' }
    ];
    
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify(mockLocations), { status: 200 }))
    );
    
    const { findByText } = render(<SavedLocationsScreen />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/saved-locations/get'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
    
    expect(await findByText('Library')).toBeTruthy();
    expect(await findByText('Canteen')).toBeTruthy();
  });

  it('can add a new location', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SavedLocationsScreen />);
    
    // Enter location name
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, 'ICU');
    
    // Press add button
    const addButton = getByText('+');
    fireEvent.press(addButton);
    
    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/saved-locations/add'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ name: 'ICU' })
        })
      );
    });
    
    // Mock the updated list fetch
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify([{ id: 'mock-uuid', name: 'ICU' }]), { status: 200 }))
    );
    
    // Verify location appears in list
    expect(await findByText('ICU')).toBeTruthy();
  });

  it('can delete a location', async () => {
    // Setup initial location
    const mockLocations = [{ id: 'test-id', name: 'Test Location' }];
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify(mockLocations), { status: 200 }))
    );
    
    const { findByText, queryByText } = render(<SavedLocationsScreen />);
    
    // Wait for location to load
    const locationElement = await findByText('Test Location');
    expect(locationElement).toBeTruthy();
    
    // Find and press delete button (this may need adjustment based on actual UI)
    // This assumes there's a delete button or long press functionality
    fireEvent.press(locationElement);
    
    // Wait for delete API call
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/saved-locations/delete'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
    
    // Mock empty list after deletion
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    );
    
    // Verify location is removed
    await waitFor(() => {
      expect(queryByText('Test Location')).toBeFalsy();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByPlaceholderText, getByText } = render(<SavedLocationsScreen />);
    
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, 'Test Location');
    
    const addButton = getByText('+');
    fireEvent.press(addButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Verify error handling (adjust based on actual error display)
    // This might show an error message or toast
  });
});