import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../../app/(tabs)/profile';

const mockGetIdToken = jest.fn();
const mockCurrentUser = {
  email: 'test@example.com',
  displayName: 'Test User',
  getIdToken: mockGetIdToken,
};

const mockOnAuthStateChanged = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: mockCurrentUser,
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,
  updateProfile: mockUpdateProfile,
}));

const mockLaunchCamera = jest.fn();
const mockLaunchImageLibrary = jest.fn();
jest.mock('react-native-image-picker', () => ({
  launchCamera: mockLaunchCamera,
  launchImageLibrary: mockLaunchImageLibrary,
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation();

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetIdToken.mockResolvedValue('mock-token');
  mockOnAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockCurrentUser);
    return jest.fn(); // unsubscribe function
  });
  
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ success: true }), { status: 200 })
  );
});

describe('ProfileScreen', () => {
  it('renders user information when user is present', async () => {
    const { findByText, findByDisplayValue } = render(<ProfileScreen />);
    
    expect(await findByText('test@example.com')).toBeTruthy();
    expect(await findByDisplayValue('Test User')).toBeTruthy();
    expect(await findByText('Sign Out')).toBeTruthy();
  });

  it('handles sign out functionality', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);
    
    const { getByText } = render(<ProfileScreen />);
    
    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('shows error when trying to save empty display name', async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    
    // Enter edit mode
    const editButton = getByText('Edit Display Name');
    fireEvent.press(editButton);
    
    // Clear the input
    const input = getByPlaceholderText('New display name');
    fireEvent.changeText(input, '');
    
    // Try to save
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Display name cannot be empty'
    );
  });

  it('successfully updates display name', async () => {
    mockUpdateProfile.mockResolvedValueOnce(undefined);
    
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    
    // Enter edit mode
    const editButton = getByText('Edit Display Name');
    fireEvent.press(editButton);
    
    // Enter new name
    const input = getByPlaceholderText('New display name');
    fireEvent.changeText(input, 'New Name');
    
    // Save
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockCurrentUser,
        { displayName: 'New Name' }
      );
    });
    
    // Verify API call to update backend
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/update'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ displayName: 'New Name' })
        })
      );
    });
  });

  it('handles image picker for profile photo', async () => {
    mockLaunchImageLibrary.mockImplementation((options, callback) => {
      callback({
        assets: [{
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          fileName: 'test-image.jpg'
        }]
      });
    });
    
    const { getByText } = render(<ProfileScreen />);
    
    // Assuming there's a button to change profile photo
    const changePhotoButton = getByText('Change Photo');
    fireEvent.press(changePhotoButton);
    
    await waitFor(() => {
      expect(mockLaunchImageLibrary).toHaveBeenCalled();
    });
    
    // Verify image upload API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/upload-photo'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    
    const editButton = getByText('Edit Display Name');
    fireEvent.press(editButton);
    
    const input = getByPlaceholderText('New display name');
    fireEvent.changeText(input, 'New Name');
    
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Verify error handling
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Failed to update profile. Please try again.'
    );
  });
});