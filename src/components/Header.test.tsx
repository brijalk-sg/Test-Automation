import { render, screen } from '@testing-library/react';
import { Header } from './Header'; // Assuming Header.tsx is in the same directory

describe('Header', () => {
  // Test Case 1: Basic rendering check
  test('should render the Header component without crashing', () => {
    render(<Header />);
    // Expect the main header element to be in the document
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  // Test Case 2: Logo content verification
  test('should display the logo icon and text correctly', () => {
    render(<Header />);
    // Check for the logo icon
    expect(screen.getByText('⚡')).toBeInTheDocument();
    // Check for the logo text
    expect(screen.getByText('TestGen AI')).toBeInTheDocument();
  });

  // Test Case 3: Tagline content verification
  test('should display the tagline text correctly', () => {
    render(<Header />);
    // Check for the tagline text
    expect(screen.getByText('AI-powered test case generator for React components')).toBeInTheDocument();
  });

  // Test Case 4: Badge content verification
  test('should display the technology badge text correctly', () => {
    render(<Header />);
    // Check for the badge text
    expect(screen.getByText('React + Jest + RTL (React Testing Library)')).toBeInTheDocument();
  });

  // Test Case 5: Accessibility - Header element role
  test('should have a header element with the implicit role of banner for accessibility', () => {
    render(<Header />);
    const headerElement = screen.getByRole('banner');
    expect(headerElement).toBeInTheDocument();
    // Ensure it's actually the <header> HTML element
    expect(headerElement.tagName).toBe('HEADER');
  });

  // Test Case 6: Accessibility - All key text content is visible and accessible
  test('should ensure all key text content is visible and accessible to screen readers', () => {
    render(<Header />);
    // Verify visibility of main textual elements
    expect(screen.getByText('TestGen AI')).toBeVisible();
    expect(screen.getByText('AI-powered test case generator for React components')).toBeVisible();
    expect(screen.getByText('React + Jest + RTL (React Testing Library)')).toBeVisible();
    expect(screen.getByText('⚡')).toBeVisible();
  });

  // Test Case 7: Structure - Check for specific class names if they are critical for styling/layout
  test('should render with expected class names for styling', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toHaveClass('header');
    expect(screen.getByText('TestGen AI').closest('.logo')).toHaveClass('logo');
    expect(screen.getByText('AI-powered test case generator for React components').closest('.header-left')).toHaveClass('header-left');
    expect(screen.getByText('React + Jest + RTL (React Testing Library)').closest('.header-badge')).toHaveClass('header-badge');
  });

  // Note: This component is purely presentational and static.
  // - User interactions: Not applicable as there are no interactive elements (buttons, links, inputs).
  // - Props variations: Not applicable as the component does not accept any props.
  // - Edge cases: For a static component, ensuring all content is always present covers most "edge cases".
  // - Error states/Loading states: Not applicable as the component does not manage state or external data.
  // - Mock external dependencies/API calls: Not applicable as there are no external dependencies or API calls.
});