```tsx
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

            expect(screen.getByLabelText(/Gemini API Key/i)).toBeInTheDocument();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Show API key/i })).toBeInTheDocument();
            expect(screen.getByText('🔑')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('AIzaSy...')).toBeInTheDocument();
            expect(screen.getByText('Your key stays in your browser — never sent to our servers.')).toBeInTheDocument();
        });

        it('should render with the correct label and icon when component loads', () => {
            render(<ApiKeyInput {...defaultProps} />);

            const label = screen.getByText(/Gemini API Key/i);
            const icon = screen.getByText('🔑');

            expect(label).toBeInTheDocument();
            expect(icon).toBeInTheDocument();
        });

        it('should render input with password type by default when component initializes', () => {
            render(<ApiKeyInput {...defaultProps} />);

            const input = screen.getByLabelText(/Gemini API Key/i);
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
            expect(screen.getByText('Your key stays in your browser — never sent to our servers.')).toHaveClass('api-key-hint');
        });

        it('should render the hint text correctly', () => {
            render(<ApiKeyInput {...defaultProps} />);
            const hintText = screen.getByText('Your key stays in your browser — never sent to our servers.');
            expect(hintText).toBeInTheDocument();
            expect(hintText.tagName).toBe('P');
        });
    });

    describe('Props', () => {
        it('should display the provided apiKey value when prop is passed', () => {
            const apiKey = 'AIzaSy-test123';
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
            const apiKey = 'AIzaSy-test!@#$%^&*()';
            render(<ApiKeyInput {...defaultProps} apiKey={apiKey} />);

            const input = screen.getByDisplayValue(apiKey);
            expect(input).toBeInTheDocument();
        });

        it('should handle very long apiKey values when prop exceeds normal length', () => {
            const longApiKey = 'AIzaSy-' + 'x'.repeat(100);
            render(<ApiKeyInput {...defaultProps} apiKey={longApiKey} />);

            const input = screen.getByDisplayValue(longApiKey);
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(longApiKey);
        });

        it('should update the input value when the apiKey prop changes', () => {
            const { rerender } = render(<ApiKeyInput {...defaultProps} apiKey="initial-key" />);
            const input = screen.getByRole('textbox');
            expect(input).toHaveValue('initial-key');

            rerender(<ApiKeyInput {...defaultProps} apiKey="updated-key" />);
            expect(input).toHaveValue('updated-key');
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

        it('should call onApiKeyChange when user uses backspace to delete characters', async () => {
            const user = userEvent.setup();
            const onApiKeyChange = jest.fn();

            render(<ApiKeyInput {...defaultProps} apiKey="123" onApiKeyChange={onApiKeyChange} />);
            const input = screen.getByRole('textbox');

            await user.type(input, '{backspace}'); // Deletes '3'
            expect(onApiKeyChange).toHaveBeenLastCalledWith('12');
            await user.type(input, '{backspace}'); // Deletes '2'
            expect(onApiKeyChange).toHaveBeenLastCalledWith('1');
            await user.type(input, '{backspace}'); // Deletes '1'
            expect(onApiKeyChange).toHaveBeenLastCalledWith('');
            expect(onApiKeyChange).toHaveBeenCalledTimes(3);
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

            toggleButton = screen.getByRole('button