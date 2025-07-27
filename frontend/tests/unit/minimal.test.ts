import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

describe('Minimal Test', () => {
  it('renders a view', () => {
    const { getByTestId } = render(<View testID="minimal-view" />);
    expect(getByTestId('minimal-view')).toBeTruthy();
  });
});
