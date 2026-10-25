import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header Component', () => {
  it('renders institution name and branding', () => {
    render(
      <Header
        institutionName="Springfield High School"
        userEmail="admin@springfield.edu"
      />
    );

    expect(screen.getByText('EduNexus')).toBeInTheDocument();
    expect(screen.getByText('Springfield High School')).toBeInTheDocument();
    expect(screen.getByText('admin@springfield.edu')).toBeInTheDocument();
  });
});
