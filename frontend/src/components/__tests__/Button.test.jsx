import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button text correctly', () => {
    render(<Button>Submit Attendance</Button>);
    expect(screen.getByRole('button', { name: /submit attendance/i })).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Processing</Button>);
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });
});
