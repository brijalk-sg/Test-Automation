```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ResultsPanel } from './ResultsPanel';
import type { TestSuggestion, TestCategory } from '../types';

// Mock the child components
jest.mock('./TestCard', () => ({
  TestCard: ({ test }: { test: TestSuggestion }) => (
    <div data-testid={`test-card-${test.id}`}>
      <span>{test.description}</span>
      <span>{test.priority}</span>
    </div>
  ),
}));

jest.mock('./CategoryTabs', () =>