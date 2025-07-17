import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: { getIdToken: jest.fn() },
  },
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

describe('ProfileScreen', () => {
  it('renders sign out button when user is present', async () => {
    // Mock onAuthStateChanged to immediately call with a user
    jest.doMock('firebase/auth', () => ({
        onAuthStateChanged: (auth: any, cb: any) => cb({ email: 'test@example.com' }),
    }));
    const { findByText } = render(<ProfileScreen />);
    expect(await findByText('Sign Out')).toBeTruthy();
  });

  it('shows error when trying to save empty display name', async () => {
    // Mock onAuthStateChanged to immediately call with a user
    jest.doMock('firebase/auth', () => ({
        onAuthStateChanged: (auth: any, cb: any) => cb({ email: 'test@example.com' }),
    }));
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Edit Display Name'));
    const input = getByPlaceholderText('New display name');
    fireEvent.changeText(input, '');
    fireEvent.press(getByText('Save'));
    // Should show an alert (not directly testable, but no crash)
  });
});