```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock child components to isolate App's logic
jest.mock('./components/Header', () => ({
  Header: () => <div data-testid="header">Header Mock</div>,
}));
jest.mock('./components/CodeEditor', () => ({
  CodeEditor: ({ code, onCodeChange, placeholder }: any) => (
    <textarea
      data-testid="code-editor"
      value={code}
      onChange={(e) => onCodeChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Component code editor"