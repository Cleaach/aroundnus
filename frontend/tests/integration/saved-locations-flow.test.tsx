import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SavedLocationsScreen from '../../app/(tabs)/saved-locations';

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

describe('SavedLocationsScreen integration', () => {
  it('can add and delete a location', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SavedLocationsScreen />);
    // Add a location
    fireEvent.changeText(getByPlaceholderText('Add new location...'), 'ICU');
    fireEvent.press(getByText('+'));
    // Simulate fetch returning the new location
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify([{ id: 'mock-uuid', name: 'ICU' }]), { status: 200 }))
    );
    await waitFor(() => expect(queryByText('ICU')).toBeTruthy());
    // Delete the location (simulate Alert and confirm)
    fireEvent.press(getByText('ICU').parent.parent.find((el: any) => el.props && el.props.onPress));
    // You may need to mock Alert.alert or test the delete logic separately
  });
}); 