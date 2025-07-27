import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SavedLocationsScreen from '../../app/(tabs)/saved-locations';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() }),
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
global.fetch = jest.fn(() =>
  Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
);

describe('SavedLocationsScreen', () => {
  it('disables add button for invalid location', () => {
    const { getByPlaceholderText, getByText } = render(<SavedLocationsScreen />);
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, 'Invalid Location');
    const addButton = getByText('+').parent;
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables add button for allowed location', () => {
    const { getByPlaceholderText, getByText } = render(<SavedLocationsScreen />);
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, 'ICU');
    const addButton = getByText('+').parent;
    expect(addButton.props.accessibilityState.disabled).toBe(false);
  });

  it('shows suggestions as user types', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SavedLocationsScreen />);
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, 'IC');
    await waitFor(() => {
      expect(getByText('ICU')).toBeTruthy();
      expect(queryByText('Pharmacy')).toBeNull();
    });
  });

  it('does not add empty location', () => {
    const { getByPlaceholderText, getByText } = render(<SavedLocationsScreen />);
    const input = getByPlaceholderText('Add new location...');
    fireEvent.changeText(input, '');
    const addButton = getByText('+').parent;
    expect(addButton.props.accessibilityState.disabled).toBe(true);
  });
});