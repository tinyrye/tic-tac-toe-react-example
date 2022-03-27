import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe Status Line', () => {
  render(<App />);
  const linkElement = screen.getByText(/\'s turn/i);
  expect(linkElement).toBeInTheDocument();
});
