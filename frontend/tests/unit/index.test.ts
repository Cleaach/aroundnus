import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 1, longitude: 2 } })),
}));

describe('HomeScreen', () => {
  it('shows suggestions for matching destination', () => {
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('🔍  Destination');
    fireEvent.changeText(input, 'ICU');
    expect(getByText('ICU')).toBeTruthy();
  });

  it('shows no suggestions for non-matching input', () => {
    const { getByPlaceholderText, queryByText } = render(<HomeScreen />);
    const input = getByPlaceholderText('🔍  Destination');
    fireEvent.changeText(input, 'Nonexistent');
    expect(queryByText('No destinations found')).toBeTruthy();
  });
});