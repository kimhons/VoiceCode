import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ClinicalTemplateLibraryScreen from '../../../screens/medical/ClinicalTemplateLibraryScreen';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ClinicalTemplateLibraryScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getByText('Template Library')).toBeTruthy();
    expect(getByPlaceholderText('Search templates...')).toBeTruthy();
  });

  it('displays template categories', () => {
    const { getAllByText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getAllByText('SOAP Notes').length).toBeGreaterThan(0);
    expect(getAllByText('Progress Notes').length).toBeGreaterThan(0);
    expect(getAllByText('Discharge').length).toBeGreaterThan(0);
    expect(getAllByText('Referrals').length).toBeGreaterThan(0);
  });

  it('displays specialty filters', () => {
    const { getAllByText, getByText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getByText('All Specialties')).toBeTruthy();
    expect(getAllByText('General Practice').length).toBeGreaterThan(0);
    expect(getAllByText('Cardiology').length).toBeGreaterThan(0);
  });

  it('displays template cards with proper information', () => {
    const { getByText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getByText('Standard SOAP Note')).toBeTruthy();
    expect(getByText('Cardiology Consult')).toBeTruthy();
  });

  it('filters templates by search query', () => {
    const { getByPlaceholderText } = render(<ClinicalTemplateLibraryScreen />);

    const searchInput = getByPlaceholderText('Search templates...');
    fireEvent.changeText(searchInput, 'Cardiology');

    // Search input should update
    expect(searchInput.props.value).toBe('Cardiology');
  });

  it('shows use template and preview buttons', () => {
    const { getAllByText } = render(<ClinicalTemplateLibraryScreen />);

    const useButtons = getAllByText('Use Template');
    const previewButtons = getAllByText('Preview');

    expect(useButtons.length).toBeGreaterThan(0);
    expect(previewButtons.length).toBeGreaterThan(0);
  });

  it('displays community templates button', () => {
    const { getByText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getByText('Community Templates')).toBeTruthy();
  });

  it('shows template count in results', () => {
    const { getByText } = render(<ClinicalTemplateLibraryScreen />);

    expect(getByText(/templates found/)).toBeTruthy();
  });
});
