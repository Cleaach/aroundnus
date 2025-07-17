import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../app/signin';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('../../firebase', () => ({
  auth: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn((auth, email, password) => {
    if (email === 'user@example.com' && password === 'password123') {
      return Promise.resolve();
    }
    return Promise.reject({ code: 'auth/wrong-password' });
  }),
}));

global.fetch = jest.fn((input: RequestInfo | URL, options?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  if (url.includes('/get')) {
    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  }
  if (url.includes('/add')) {
    return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  }
  if (url.includes('/delete')) {
    return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  }
  return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
});

describe('SignInScreen integration', () => {
  it('allows a user to sign in with correct credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'user@example.com');
    fireEvent.press(getByText(/›|Go/));
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText(/Go/));
  });

  it('shows error for wrong password', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    fireEvent.changeText(getByPlaceholderText('email@domain.com'), 'user@example.com');
    fireEvent.press(getByText(/›|Go/));
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText(/Go/));
  });
});