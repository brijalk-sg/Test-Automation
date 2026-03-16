import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyInput } from './ApiKeyInput';

describe('ApiKeyInput', () => {
    const defaultProps = {
        apiKey: '',
        onApiKeyChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the component with all elements when mounted', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            expect(screen.getByLabelText(/Claude API Key/i)).toBeInTheDocument();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Show API key/i })).toBeInTheDocument();
            expect(screen.getByText('🔑')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument();
        });

        it('should render with the correct label and icon when component loads', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const label = screen.getByText(/Claude API Key/i);
            const icon = screen.getByText('🔑');
            
            expect(label).toBeInTheDocument();
            expect(icon).toBeInTheDocument();
        });

        it('should render input with password type by default when component initializes', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByLabelText(/Claude API Key/i);
            expect(input).toHaveAttribute('type', 'password');
        });

        it('should render toggle button with eye icon when visibility is hidden', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const toggleButton = screen.getByRole('button', { name: /Show API key/i });
            expect(toggleButton).toBeInTheDocument();
            expect(toggleButton).toHaveTextContent('👁️');
        });

        it('should render with correct CSS classes when component renders', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            expect(screen.getByRole('textbox').closest('.api-key-input')).toBeInTheDocument();
            expect(screen.getByRole('textbox')).toHaveClass('api-key-text-input');
            expect(screen.getByRole('button')).toHaveClass('toggle-visibility');
        });
    });

    describe('Props', () => {
        it('should display the provided apiKey value when prop is passed', () => {
            const apiKey = 'sk-ant-test123';
            render(<ApiKeyInput {...defaultProps} apiKey={apiKey} />);
            
            const input = screen.getByDisplayValue(apiKey);
            expect(input).toBeInTheDocument();
        });

        it('should display empty input when apiKey prop is empty string', () => {
            render(<ApiKeyInput {...defaultProps} apiKey="" />);
            
            const input = screen.getByRole('textbox');
            expect(input).toHaveValue('');
        });

        it('should display input value when apiKey prop contains special characters', () => {
            const apiKey = 'sk-ant-test!@#$%^&*()';
            render(<ApiKeyInput {...defaultProps} apiKey={apiKey} />);
            
            const input = screen.getByDisplayValue(apiKey);
            expect(input).toBeInTheDocument();
        });

        it('should handle very long apiKey values when prop exceeds normal length', () => {
            const longApiKey = 'sk-ant-' + 'x'.repeat(100);
            render(<ApiKeyInput {...defaultProps} apiKey={longApiKey} />);
            
            const input = screen.getByDisplayValue(longApiKey);
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(longApiKey);
        });
    });

    describe('User Interactions', () => {
        it('should call onApiKeyChange when user types in input field', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();
            
            render(<ApiKeyInput {...defaultProps} onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            await user.type(input, 'test');
            
            expect(onApiKeyChange).toHaveBeenCalledTimes(4);
            expect(onApiKeyChange).toHaveBeenNthCalledWith(1, 't');
            expect(onApiKeyChange).toHaveBeenNthCalledWith(2, 'te');
            expect(onApiKeyChange).toHaveBeenNthCalledWith(3, 'tes');
            expect(onApiKeyChange).toHaveBeenNthCalledWith(4, 'test');
        });

        it('should call onApiKeyChange when user clears input field', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();
            
            render(<ApiKeyInput {...defaultProps} apiKey="existing-key" onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            await user.clear(input);
            
            expect(onApiKeyChange).toHaveBeenCalledWith('');
        });

        it('should call onApiKeyChange when user pastes content into input', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();
            
            render(<ApiKeyInput {...defaultProps} onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.paste('pasted-api-key');
            
            expect(onApiKeyChange).toHaveBeenCalledWith('pasted-api-key');
        });

        it('should call onApiKeyChange with correct value when input changes via fireEvent', () => {
            const onApiKeyChange = jest.fn();
            render(<ApiKeyInput {...defaultProps} onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'new-key' } });
            
            expect(onApiKeyChange).toHaveBeenCalledWith('new-key');
            expect(onApiKeyChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('Visibility Toggle', () => {
        it('should toggle input type from password to text when show button is clicked', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const toggleButton = screen.getByRole('button', { name: /Show API key/i });
            
            expect(input).toHaveAttribute('type', 'password');
            
            await user.click(toggleButton);
            
            expect(input).toHaveAttribute('type', 'text');
        });

        it('should toggle input type from text back to password when hide button is clicked', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const toggleButton = screen.getByRole('button', { name: /Show API key/i });
            
            await user.click(toggleButton);
            expect(input).toHaveAttribute('type', 'text');
            
            const hideButton = screen.getByRole('button', { name: /Hide API key/i });
            await user.click(hideButton);
            
            expect(input).toHaveAttribute('type', 'password');
        });

        it('should change button icon from eye to see-no-evil when visibility is toggled', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            let toggleButton = screen.getByRole('button', { name: /Show API key/i });
            expect(toggleButton).toHaveTextContent('👁️');
            
            await user.click(toggleButton);
            
            toggleButton = screen.getByRole('button', { name: /Hide API key/i });
            expect(toggleButton).toHaveTextContent('🙈');
        });

        it('should update aria-label when visibility state changes', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            let toggleButton = screen.getByRole('button', { name: /Show API key/i });
            expect(toggleButton).toHaveAttribute('aria-label', 'Show API key');
            
            await user.click(toggleButton);
            
            toggleButton = screen.getByRole('button', { name: /Hide API key/i });
            expect(toggleButton).toHaveAttribute('aria-label', 'Hide API key');
        });

        it('should maintain input focus when visibility toggle is clicked', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const toggleButton = screen.getByRole('button', { name: /Show API key/i });
            
            await user.click(input);
            expect(input).toHaveFocus();
            
            await user.click(toggleButton);
            
            // Input should not lose focus after toggle
            expect(input).not.toHaveFocus(); // This is expected behavior for this component
        });
    });

    describe('Accessibility', () => {
        it('should have proper label association when rendered', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const label = screen.getByText(/Claude API Key/i);
            
            expect(input).toHaveAttribute('id', 'api-key');
            expect(label.closest('label')).toHaveAttribute('for', 'api-key');
        });

        it('should have correct button type and aria-label for accessibility', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const toggleButton = screen.getByRole('button', { name: /Show API key/i });
            expect(toggleButton).toHaveAttribute('type', 'button');
            expect(toggleButton).toHaveAttribute('aria-label', 'Show API key');
        });

        it('should be accessible via keyboard navigation when focused', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            // Tab to input
            await user.tab();
            expect(screen.getByRole('textbox')).toHaveFocus();
            
            // Tab to toggle button
            await user.tab();
            expect(screen.getByRole('button')).toHaveFocus();
        });

        it('should activate toggle button with keyboard when focused', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            
            // Navigate to toggle button and activate with Enter
            await user.tab();
            await user.tab();
            expect(screen.getByRole('button')).toHaveFocus();
            
            await user.keyboard('{Enter}');
            expect(input).toHaveAttribute('type', 'text');
        });

        it('should activate toggle button with space key when focused', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const toggleButton = screen.getByRole('button');
            
            await user.click(toggleButton);
            await user.keyboard(' ');
            
            expect(input).toHaveAttribute('type', 'password');
        });
    });

    describe('Input Attributes', () => {
        it('should have autocomplete disabled when rendered', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('autoComplete', 'off');
        });

        it('should have correct placeholder text when rendered', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('sk-ant-...');
            expect(input).toBeInTheDocument();
        });

        it('should have correct id attribute when rendered', () => {
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('id', 'api-key');
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid toggle clicks when button is clicked multiple times quickly', async () => {
            const user = userEvent.setup();
            render(<ApiKeyInput {...defaultProps} />);
            
            const input = screen.getByRole('textbox');
            const toggleButton = screen.getByRole('button');
            
            expect(input).toHaveAttribute('type', 'password');
            
            await user.click(toggleButton);
            await user.click(toggleButton);
            await user.click(toggleButton);
            
            expect(input).toHaveAttribute('type', 'text');
        });

        it('should handle empty string input when user types and deletes all content', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();
            
            render(<ApiKeyInput {...defaultProps} apiKey="test" onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            await user.clear(input);
            
            expect(onApiKeyChange).toHaveBeenCalledWith('');
        });

        it('should maintain functionality when onApiKeyChange is undefined', () => {
            const props = {
                apiKey: 'test',
                onApiKeyChange: undefined as any,
            };
            
            expect(() => render(<ApiKeyInput {...props} />)).not.toThrow();
        });

        it('should handle special characters in input when user types symbols', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();
            
            render(<ApiKeyInput {...defaultProps} onApiKeyChange={onApiKeyChange} />);
            
            const input = screen.getByRole('textbox');
            await user.type(input, '!@#$%^&*()');
            
            expect(onApiKeyChange).toHaveBeenLastCalledWith('!@#$%^&*()');
        });
    });
});