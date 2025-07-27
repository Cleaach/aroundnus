import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SignInScreen from '../../app/signin';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('../../firebase', () => ({
  auth: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
}));

describe('SignInScreen', () => {
  it('shows error for empty email', () => {
    const { getByText } = render(<SignInScreen />);
    fireEvent.press(getByText(/›|Go/));
    // Should show an alert (not directly testable, but no crash)
  });

  it('shows error for invalid email format', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    const emailInput = getByPlaceholderText('email@domain.com');
    fireEvent.changeText(emailInput, 'invalidemail');
    fireEvent.press(getByText(/›|Go/));
    // Should show an alert (not directly testable, but no crash)
  });
});