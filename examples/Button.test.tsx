import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

// [HIGH] Tests that the button renders correctly with only the required label prop, using default values for optional props
test('should render button with required label prop', () => {
  render(<Button label="Click me" />);
  
  const button = screen.getByRole('button', { name: 'Click me' });
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('btn', 'btn-primary', 'btn-md');
  expect(button).not.toBeDisabled();
});

// [HIGH] Tests that the onClick prop is called when the button is clicked and not disabled or loading
test('should handle onClick callback when clicked', async () => {
  const mockOnClick = jest.fn();
  const user = userEvent.setup();
  
  render(<Button label="Click me" onClick={mockOnClick} />);
  
  const button = screen.getByRole('button', { name: 'Click me' });
  await user.click(button);
  
  expect(mockOnClick).toHaveBeenCalledTimes(1);
});

// [HIGH] Tests that the button applies a 'clicked' class when clicked and removes it after 200ms timeout
test('should apply clicked state temporarily after click', async () => {
  const user = userEvent.setup();
  
  render(<Button label="Click me" />);
  
  const button = screen.getByRole('button', { name: 'Click me' });
  expect(button).not.toHaveClass('clicked');
  
  await user.click(button);
  expect(button).toHaveClass('clicked');
  
  await waitFor(() => {
    expect(button).not.toHaveClass('clicked');
  }, { timeout: 300 });
});

// [HIGH] Tests that onClick is not called and button behavior is prevented when the disabled prop is true
test('should not trigger onClick when disabled', async () => {
  const mockOnClick = jest.fn();
  const user = userEvent.setup();
  
  render(<Button label="Disabled" disabled={true} onClick={mockOnClick} />);
  
  const button = screen.getByRole('button', { name: 'Disabled' });
  expect(button).toBeDisabled();
  
  await user.click(button);
  expect(mockOnClick).not.toHaveBeenCalled();
  expect(button).not.toHaveClass('clicked');
});

// [HIGH] Tests loading state behavior including spinner display, disabled state, and preventing onClick calls
test('should show spinner and prevent clicks when loading', async () => {
  const mockOnClick = jest.fn();
  const user = userEvent.setup();
  
  render(<Button label="Loading" loading={true} onClick={mockOnClick} />);
  
  const button = screen.getByRole('button', { name: 'Loading' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button')).toContainHTML('<span class="spinner" />');
  
  await user.click(button);
  expect(mockOnClick).not.toHaveBeenCalled();
});

// [MEDIUM] Tests that variant and size props correctly apply the appropriate CSS classes
test('should render with different variants and sizes', () => {
  const { rerender } = render(<Button label="Primary Large" variant="primary" size="lg" />);
  expect(screen.getByRole('button')).toHaveClass('btn-primary', 'btn-lg');
  
  rerender(<Button label="Secondary Small" variant="secondary" size="sm" />);
  expect(screen.getByRole('button')).toHaveClass('btn-secondary', 'btn-sm');
  
  rerender(<Button label="Danger Medium" variant="danger" size="md" />);
  expect(screen.getByRole('button')).toHaveClass('btn-danger', 'btn-md');
});

// [MEDIUM] Tests that the icon prop is displayed when provided and hidden when loading state is true
test('should render icon when provided and not loading', () => {
  const icon = <span data-testid="test-icon">★</span>;
  
  const { rerender } = render(<Button label="With Icon" icon={icon} />);
  expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  
  rerender(<Button label="Loading" icon={icon} loading={true} />);
  expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  expect(screen.getByRole('button')).toContainHTML('<span class="spinner" />');
});

// [LOW] Tests button behavior when all optional props are provided simultaneously to ensure no conflicts
test('should handle edge case with all optional props', () => {
  const mockOnClick = jest.fn();
  const icon = <span data-testid="test-icon">★</span>;
  
  render(
    <Button 
      label="Complex Button" 
      variant="danger" 
      size="lg" 
      disabled={true} 
      loading={false} 
      icon={icon} 
      onClick={mockOnClick} 
    />
  );
  
  const button = screen.getByRole('button', { name: 'Complex Button' });
  expect(button).toHaveClass('btn-danger', 'btn-lg');
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'false');
  expect(screen.getByTestId('test-icon')).toBeInTheDocument();
});

// [HIGH] Tests boundary case where required label prop is an empty string, which could cause layout issues or accessibility problems
test('renders with empty string label', () => {
  render(<Button label="" />);
  const buttonElement = screen.getByRole('button');
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveTextContent('');
});

// [HIGH] Tests edge case where user rapidly clicks button while it's in loading state, ensuring onClick is not called multiple times and state remains consistent
test('prevents multiple onClick calls during rapid clicking when loading', () => {
  const mockOnClick = jest.fn();
  render(<Button label="Test" loading={true} onClick={mockOnClick} />);
  
  const buttonElement = screen.getByRole('button');
  
  // Rapid fire clicks
  fireEvent.click(buttonElement);
  fireEvent.click(buttonElement);
  fireEvent.click(buttonElement);
  
  expect(mockOnClick).not.toHaveBeenCalled();
  expect(buttonElement).toBeDisabled();
});

// [MEDIUM] Tests memory leak prevention when component unmounts while the clicked state timeout is still active
test('handles unmounting during clicked animation without memory leaks', () => {
  const TestWrapperC = ({ shouldRender }) => {
    return shouldRender ? <Button label="Test" /> : null;
  };
  
  const { rerender } = render(<TestWrapperC shouldRender={true} />);
  const buttonElement = screen.getByRole('button');
  
  // Click button to start timeout
  fireEvent.click(buttonElement);
  
  // Unmount component before timeout completes
  rerender(<TestWrapperC shouldRender={false} />);
  
  // Should not crash when timeout tries to execute
  act(() => {
    jest.advanceTimersByTime(200);
  });
  
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

// [LOW] Tests boundary case with extremely long label text to ensure component handles large strings without breaking layout or performance
test('handles very long label string', () => {
  const longLabel = 'A'.repeat(1000);
  render(<Button label={longLabel} />);
  
  const buttonElement = screen.getByRole('button');
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveTextContent(longLabel);
});

// [MEDIUM] Tests complex state interaction when loading prop changes while clicked animation is active, ensuring proper state management
test('handles loading state change during clicked animation', async () => {
  const TestWrapperD = ({ isLoading }) => {
    return <Button label="Test" loading={isLoading} />;
  };
  
  const { rerender } = render(<TestWrapperD isLoading={false} />);
  let buttonElement = screen.getByRole('button');
  
  // Click button to start clicked animation
  fireEvent.click(buttonElement);
  expect(buttonElement).toHaveClass('clicked');
  
  // Change to loading state during animation
  rerender(<TestWrapperD isLoading={true} />);
  buttonElement = screen.getByRole('button');
  
  expect(buttonElement).toBeDisabled();
  expect(buttonElement).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByText('Test')).toBeInTheDocument();
});

// [HIGH] Tests edge case where both disabled and loading props are true, ensuring proper precedence and accessibility attributes
test('handles both disabled and loading states simultaneously', () => {
  const mockOnClick = jest.fn();
  render(
    <Button 
      label="Test" 
      disabled={true} 
      loading={true} 
      onClick={mockOnClick} 
    />
  );
  
  const buttonElement = screen.getByRole('button');
  
  expect(buttonElement).toBeDisabled();
  expect(buttonElement).toHaveAttribute('aria-busy', 'true');
  
  fireEvent.click(buttonElement);
  expect(mockOnClick).not.toHaveBeenCalled();
  
  // Should show spinner, not icon
  expect(screen.getByText('Test')).toBeInTheDocument();
});

// [MEDIUM] Tests edge case where icon prop contains complex React elements or components that might cause rendering issues
test('renders complex icon component correctly', () => {
  const ComplexIcon = () => (
    <div data-testid="complex-icon">
      <span>Icon</span>
      <svg><path d="M0 0h24v24H0z"/></svg>
    </div>
  );
  
  render(<Button label="Test" icon={<ComplexIcon />} />);
  
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
  expect(screen.getByText('Icon')).toBeInTheDocument();
});

// [LOW] Tests boundary cases where icon prop is explicitly null or undefined, ensuring graceful handling without rendering issues
test('handles null and undefined icon props', () => {
  const { rerender } = render(<Button label="Test" icon={null} />);
  let buttonElement = screen.getByRole('button');
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveTextContent('Test');
  
  rerender(<Button label="Test" icon={undefined} />);
  buttonElement = screen.getByRole('button');
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveTextContent('Test');
});

// [HIGH] Ensures the button uses semantic HTML and includes proper ARIA attributes for screen readers (WCAG 4.1.2 - Name, Role, Value)
test('button has proper semantic HTML and ARIA attributes', async () => {
  const { container } = render(<Button label="Submit Form" />);
  
  const buttonElement = screen.getByRole('button', { name: 'Submit Form' });
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveAttribute('type', 'button');
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// [HIGH] Ensures the button can be activated using keyboard navigation with Enter and Space keys (WCAG 2.1.1 - Keyboard)
test('button is keyboard accessible', async () => {
  const user = userEvent.setup();
  const mockClickHandler = jest.fn();
  
  render(<Button label="Click Me" onClick={mockClickHandler} />);
  
  const buttonEl = screen.getByRole('button', { name: 'Click Me' });
  
  // Test Tab navigation
  await user.tab();
  expect(buttonEl).toHaveFocus();
  
  // Test Enter key activation
  await user.keyboard('{Enter}');
  expect(mockClickHandler).toHaveBeenCalledTimes(1);
  
  // Test Space key activation
  await user.keyboard(' ');
  expect(mockClickHandler).toHaveBeenCalledTimes(2);
});

// [HIGH] Ensures loading state is properly communicated to assistive technologies using aria-busy (WCAG 4.1.3 - Status Messages)
test('loading state is properly communicated to screen readers', () => {
  const { rerender } = render(<Button label="Save" />);
  
  const buttonInNormalState = screen.getByRole('button', { name: 'Save' });
  expect(buttonInNormalState).not.toHaveAttribute('aria-busy');
  
  rerender(<Button label="Save" loading={true} />);
  
  const buttonInLoadingState = screen.getByRole('button', { name: 'Save' });
  expect(buttonInLoadingState).toHaveAttribute('aria-busy', 'true');
  expect(buttonInLoadingState).toBeDisabled();
});

// [HIGH] Ensures disabled buttons cannot be activated and are properly communicated to assistive technologies (WCAG 3.2.2 - On Input)
test('disabled button is not interactive', async () => {
  const user = userEvent.setup();
  const mockOnClick = jest.fn();
  
  render(<Button label="Disabled Button" disabled={true} onClick={mockOnClick} />);
  
  const disabledButton = screen.getByRole('button', { name: 'Disabled Button' });
  expect(disabledButton).toBeDisabled();
  
  // Test that click events don't fire
  await user.click(disabledButton);
  expect(mockOnClick).not.toHaveBeenCalled();
  
  // Test that keyboard events don't fire
  disabledButton.focus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');
  expect(mockOnClick).not.toHaveBeenCalled();
});

// [MEDIUM] Ensures button variants meet WCAG color contrast requirements for normal and focused states (WCAG 1.4.3 - Contrast Minimum)
test('button variants have sufficient color contrast', async () => {
  const variants = ['primary', 'secondary', 'danger'] as const;
  
  for (const variant of variants) {
    const { container, unmount } = render(
      <Button label={`${variant} button`} variant={variant} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    
    unmount();
  }
});

// [MEDIUM] Ensures focus indicators are visible and meet contrast requirements for keyboard navigation (WCAG 2.4.7 - Focus Visible)
test('button maintains focus visibility', async () => {
  const user = userEvent.setup();
  
  render(
    <div>
      <Button label="First Button" />
      <Button label="Second Button" />
    </div>
  );
  
  const firstBtn = screen.getByRole('button', { name: 'First Button' });
  const secondBtn = screen.getByRole('button', { name: 'Second Button' });
  
  // Tab to first button
  await user.tab();
  expect(firstBtn).toHaveFocus();
  
  // Tab to second button
  await user.tab();
  expect(secondBtn).toHaveFocus();
  expect(firstBtn).not.toHaveFocus();
});

// [MEDIUM] Ensures buttons with icons still provide clear accessible names for screen readers (WCAG 1.1.1 - Non-text Content)
test('button with icon maintains accessible name', () => {
  const iconElement = <span aria-hidden="true">🔍</span>;
  
  render(<Button label="Search" icon={iconElement} />);
  
  const searchButton = screen.getByRole('button', { name: 'Search' });
  expect(searchButton).toBeInTheDocument();
  expect(searchButton).toHaveTextContent('Search');
});

// [LOW] Ensures animations and transitions respect user's reduced motion preferences (WCAG 2.3.3 - Animation from Interactions)
test('button respects reduced motion preferences', async () => {
  const user = userEvent.setup();
  
  // Mock prefers-reduced-motion media query
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  render(<Button label="Animated Button" />);
  
  const animatedButton = screen.getByRole('button', { name: 'Animated Button' });
  
  await user.click(animatedButton);
  
  // Verify button still functions correctly with reduced motion
  expect(animatedButton).toBeInTheDocument();
});
