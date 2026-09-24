import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CarSpot dashboard and vehicle cards', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /carspot/i })).toBeInTheDocument();
  expect(screen.getByText(/bmw/i)).toBeInTheDocument();
  expect(screen.getByText(/audi/i)).toBeInTheDocument();
});
