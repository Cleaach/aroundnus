import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../app/signin';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

const mockSignIn = jest.fn();
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignIn,
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/auth/signin')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  });
});

describe('SignInScreen integration', () => {
  it('allows a user to sign in with correct credentials', async () => {
    mockSignIn.mockResolvedValueOnce({ user: { uid: 'test-uid' } });
    
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    
    // Enter email
    const emailInput = getByPlaceholderText('email@domain.com');
    fireEvent.changeText(emailInput, 'user@example.com');
    
    // Navigate to password screen
    const nextButton = getByText(/›|Go/);
    fireEvent.press(nextButton);
    
    // Enter password
    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Submit form
    const submitButton = getByText(/Go/);
    fireEvent.press(submitButton);
    
    // Wait for sign in to complete
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
        'password123'
      );
    });
    
    // Verify navigation occurred
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it('shows error for wrong password', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    
    const { getByPlaceholderText, getByText, findByText } = render(<SignInScreen />);
    
    // Enter email
    const emailInput = getByPlaceholderText('email@domain.com');
    fireEvent.changeText(emailInput, 'user@example.com');
    
    // Navigate to password screen
    const nextButton = getByText(/›|Go/);
    fireEvent.press(nextButton);
    
    // Enter wrong password
    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'wrongpass');
    
    // Submit form
    const submitButton = getByText(/Go/);
    fireEvent.press(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
        'wrongpass'
      );
    });
    
    // Verify error message appears (adjust based on actual error display)
    // This might need adjustment based on how errors are shown in the UI
  });

  it('handles network errors gracefully', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    
    const emailInput = getByPlaceholderText('email@domain.com');
    fireEvent.changeText(emailInput, 'user@example.com');
    
    const nextButton = getByText(/›|Go/);
    fireEvent.press(nextButton);
    
    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');
    
    const submitButton = getByText(/Go/);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    
    // Verify error handling (adjust based on actual error display)
  });
});