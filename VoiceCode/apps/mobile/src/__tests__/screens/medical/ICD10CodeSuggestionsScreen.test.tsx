import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ICD10CodeSuggestionsScreen from '../../../screens/medical/ICD10CodeSuggestionsScreen';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ICD10CodeSuggestionsScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ICD10CodeSuggestionsScreen />);

    expect(getByText('ICD-10 Codes')).toBeTruthy();
    expect(getByPlaceholderText('Search codes or descriptions...')).toBeTruthy();
  });

  it('displays AI suggested codes section', () => {
    const { getByText } = render(<ICD10CodeSuggestionsScreen />);

    expect(getByText('AI Suggested Codes')).toBeTruthy();
    expect(getByText('Live')).toBeTruthy();
  });

  it('displays code categories', () => {
    const { getAllByText } = render(<ICD10CodeSuggestionsScreen />);

    expect(getAllByText('Infectious').length).toBeGreaterThan(0);
    expect(getAllByText('Respiratory').length).toBeGreaterThan(0);
    expect(getAllByText('Circulatory').length).toBeGreaterThan(0);
  });

  it('displays ICD-10 codes with descriptions', () => {
    const { getAllByText } = render(<ICD10CodeSuggestionsScreen />);

    expect(getAllByText('J06.9').length).toBeGreaterThan(0);
    expect(getAllByText('I10').length).toBeGreaterThan(0);
    expect(getAllByText('E11.9').length).toBeGreaterThan(0);
  });

  it('shows confidence percentages for AI suggestions', () => {
    const { getAllByText } = render(<ICD10CodeSuggestionsScreen />);

    // Check that confidence percentages exist (may be split across Text elements)
    expect(getAllByText(/95/).length).toBeGreaterThan(0);
    expect(getAllByText(/92/).length).toBeGreaterThan(0);
  });

  it('allows searching codes', () => {
    const { getByPlaceholderText } = render(<ICD10CodeSuggestionsScreen />);

    const searchInput = getByPlaceholderText('Search codes or descriptions...');
    fireEvent.changeText(searchInput, 'hypertension');

    // Search input should update
    expect(searchInput.props.value).toBe('hypertension');
  });

  it('displays all codes section', () => {
    const { getByText } = render(<ICD10CodeSuggestionsScreen />);

    expect(getByText('All Codes')).toBeTruthy();
    expect(getByText(/results/)).toBeTruthy();
  });
});
