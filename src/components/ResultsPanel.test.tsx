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

jest.mock('./CategoryTabs', () => ({
  CategoryTabs: ({ 
    activeTab, 
    onTabChange, 
    counts 
  }: { 
    activeTab: TestCategory; 
    onTabChange: (tab: TestCategory) => void; 
    counts: { unit: number; edge: number; a11y: number } 
  }) => (
    <div data-testid="category-tabs">
      <button 
        onClick={() => onTabChange('unit')}
        data-testid="unit-tab"
        className={activeTab === 'unit' ? 'active' : ''}
      >
        Unit ({counts.unit})
      </button>
      <button 
        onClick={() => onTabChange('edge')}
        data-testid="edge-tab"
        className={activeTab === 'edge' ? 'active' : ''}
      >
        Edge ({counts.edge})
      </button>
      <button 
        onClick={() => onTabChange('a11y')}
        data-testid="a11y-tab"
        className={activeTab === 'a11y' ? 'active' : ''}
      >
        A11y ({counts.a11y})
      </button>
    </div>
  ),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  type: options?.type || 'text/plain'
})) as any;

// Mock document.createElement and click
const mockClick = jest.fn();
const mockAnchor = {
  href: '',
  download: '',
  click: mockClick,
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  style: {}
};

jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
  if (tagName === 'a') {
    return mockAnchor as any;
  }
  return document.createElement(tagName);
});

const mockResults = {
  unitTests: [
    {
      id: '1',
      description: 'should render component correctly',
      code: 'test code 1',
      priority: 'high' as const,
    },
    {
      id: '2',
      description: 'should handle props',
      code: 'import { render } from "@testing-library/react";\ntest code 2',
      priority: 'medium' as const,
    },
  ],
  edgeCases: [
    {
      id: '3',
      description: 'should handle edge case',
      code: 'edge test code',
      priority: 'low' as const,
    },
  ],
  a11yTests: [
    {
      id: '4',
      description: 'should be accessible',
      code: 'import { toHaveNoViolations } from "jest-axe";\na11y test code',
      priority: 'high' as const,
    },
  ],
};

const defaultProps = {
  results: mockResults,
  loading: false,
  activeTab: 'unit' as TestCategory,
  onTabChange: jest.fn(),
  componentName: 'TestComponent',
};

describe('ResultsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state when loading is true', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={true}
          results={null}
        />
      );

      expect(screen.getByText('Generating test cases with AI...')).toBeInTheDocument();
      expect(screen.getByText('This may take 10-20 seconds')).toBeInTheDocument();
      expect(screen.getByText('🔍 Analyzing component')).toBeInTheDocument();
      expect(screen.getByText('🧠 Building prompts')).toBeInTheDocument();
      expect(screen.getByText('⚡ Calling AI model')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });

    it('should have correct loading step classes', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={true}
          results={null}
        />
      );

      const steps = document.querySelectorAll('.step');
      expect(steps[0]).toHaveClass('active');
      expect(steps[1]).toHaveClass('active');
      expect(steps[2]).toHaveClass('pulse');
    });

    it('should not render other content when loading', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={true}
          results={null}
        />
      );

      expect(screen.queryByText('No results yet')).not.toBeInTheDocument();
      expect(screen.queryByTestId('category-tabs')).not.toBeInTheDocument();
      expect(screen.queryByText('📥 Download .test.tsx')).not.toBeInTheDocument();
    });

    it('should have loading panel class', () => {
      const { container } = render(
        <ResultsPanel
          {...defaultProps}
          loading={true}
          results={null}
        />
      );

      expect(container.querySelector('.results-panel')).toBeInTheDocument();
      expect(container.querySelector('.results-loading')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when results is null and not loading', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={false}
          results={null}
        />
      );

      expect(screen.getByText('No results yet')).toBeInTheDocument();
      expect(screen.getByText(/Paste your component code/)).toBeInTheDocument();
      expect(screen.getByText('Generate Tests', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('🧪')).toBeInTheDocument();
    });

    it('should have empty state class structure', () => {
      const { container } = render(
        <ResultsPanel
          {...defaultProps}
          loading={false}
          results={null}
        />
      );

      expect(container.querySelector('.results-panel')).toBeInTheDocument();
      expect(container.querySelector('.results-empty')).toBeInTheDocument();
      expect(container.querySelector('.empty-icon')).toBeInTheDocument();
    });

    it('should not render results content in empty state', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={false}
          results={null}
        />
      );

      expect(screen.queryByTestId('category-tabs')).not.toBeInTheDocument();
      expect(screen.queryByText('📥 Download .test.tsx')).not.toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('should render results header with component name and total count', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByText('TestComponent')).toBeInTheDocument();
      expect(screen.getByText('4 tests')).toBeInTheDocument();
      expect(screen.getByText(/Results for/)).toBeInTheDocument();
    });

    it('should use default component name when not provided', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          componentName={undefined}
        />
      );

      expect(screen.getByText('Component')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByText('📥 Download .test.tsx')).toBeInTheDocument();
      expect(screen.getByText('📋 How to Use')).toBeInTheDocument();
    });

    it('should render CategoryTabs with correct props', () => {
      const onTabChange = jest.fn();
      render(
        <ResultsPanel
          {...defaultProps}
          onTabChange={onTabChange}
        />
      );

      expect(screen.getByTestId('category-tabs')).toBeInTheDocument();
      expect(screen.getByText('Unit (2)')).toBeInTheDocument();
      expect(screen.getByText('Edge (1)')).toBeInTheDocument();
      expect(screen.getByText('A11y (1)')).toBeInTheDocument();
    });

    it('should have correct CSS classes for results header', () => {
      const { container } = render(<ResultsPanel {...defaultProps} />);

      expect(container.querySelector('.results-header')).toBeInTheDocument();
      expect(container.querySelector('.results-title')).toBeInTheDocument();
      expect(container.querySelector('.component-name')).toBeInTheDocument();
      expect(container.querySelector('.total-badge')).toBeInTheDocument();
    });

    it('should calculate total count correctly with different result distributions', () => {
      const customResults = {
        unitTests: [{ id: '1', description: 'test', code: 'code', priority: 'high' as const }],
        edgeCases: [],
        a11yTests: [
          { id: '2', description: 'test2', code: 'code2', priority: 'medium' as const },
          { id: '3', description: 'test3', code: 'code3', priority: 'low' as const },
        ],
      };

      render(
        <ResultsPanel
          {...defaultProps}
          results={customResults}
        />
      );

      expect(screen.getByText('3 tests')).toBeInTheDocument();
    });
  });

  describe('Tab Interaction', () => {
    it('should display unit tests when activeTab is unit', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('test-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('test-card-3')).not.toBeInTheDocument();
    });

    it('should display edge cases when activeTab is edge', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          activeTab="edge"
        />
      );

      expect(screen.getByTestId('test-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('test-card-1')).not.toBeInTheDocument();
    });

    it('should display a11y tests when activeTab is a11y', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          activeTab="a11y"
        />
      );

      expect(screen.getByTestId('test-card-4')).toBeInTheDocument();
      expect(screen.queryByTestId('test-card-1')).not.toBeInTheDocument();
    });

    it('should call onTabChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onTabChange = jest.fn();
      render(
        <ResultsPanel
          {...defaultProps}
          onTabChange={onTabChange}
        />
      );

      await user.click(screen.getByTestId('edge-tab'));
      expect(onTabChange).toHaveBeenCalledWith('edge');
    });

    it('should maintain correct active tab visual state', () => {
      render(<ResultsPanel {...defaultProps} activeTab="edge" />);

      const edgeTab = screen.getByTestId('edge-tab');
      expect(edgeTab).toHaveClass('active');
    });

    it('should display test cards list container', () => {
      const { container } = render(<ResultsPanel {...defaultProps} />);

      expect(container.querySelector('.test-cards-list')).toBeInTheDocument();
    });
  });

  describe('Empty Categories', () => {
    it('should display no tests message when category is empty', () => {
      const emptyResults = {
        unitTests: [],
        edgeCases: [],
        a11yTests: [],
      };

      render(
        <ResultsPanel
          {...defaultProps}
          results={emptyResults}
        />
      );

      expect(screen.getByText('No tests generated for this category.')).toBeInTheDocument();
    });

    it('should display no tests message for specific empty category', () => {
      const partialResults = {
        unitTests: [{ id: '1', description: 'test', code: 'code', priority: 'high' as const }],
        edgeCases: [],
        a11yTests: [],
      };

      render(
        <ResultsPanel
          {...defaultProps}
          results={partialResults}
          activeTab="edge"
        />
      );

      expect(screen.getByText('No tests generated for this category.')).toBeInTheDocument();
      expect(screen.queryByTestId('test-card-1')).not.toBeInTheDocument();
    });

    it('should show correct count for empty categories in tabs', () => {
      const partialResults = {
        unitTests: [{ id: '1', description: 'test', code: 'code', priority: 'high' as const }],
        edgeCases: [],
        a11yTests: [],
      };

      render(
        <ResultsPanel
          {...defaultProps}
          results={partialResults}
        />
      );

      expect(screen.getByText('Unit (1)')).toBeInTheDocument();
      expect(screen.getByText('Edge (0)')).toBeInTheDocument();
      expect(screen.getByText('A11y (0)')).toBeInTheDocument();
    });
  });

  describe('Setup Guide', () => {
    it('should toggle setup guide when setup button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.queryByText('How to Integrate in Any React Project')).not.toBeInTheDocument();

      await user.click(screen.getByText('📋 How to Use'));
      expect(screen.getByText('How to Integrate in Any React Project')).toBeInTheDocument();

      await user.click(screen.getByText('✕ Hide Setup'));
      expect(screen.queryByText('How to Integrate in Any React Project')).not.toBeInTheDocument();
    });

    it('should display setup steps when setup guide is open', async () => {
      const user = userEvent.setup();
      render(<ResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('📋 How to Use'));

      expect(screen.getByText('Install test dependencies')).toBeInTheDocument();
      expect(screen.getByText(/jest.config.ts/)).toBeInTheDocument();
      expect(screen.getByText(/package.json/)).toBeInTheDocument();
      expect(screen.getByText('Run the tests')).toBeInTheDocument();
    });

    it('should include component name in setup guide file structure', async () => {
      const user = userEvent.setup();
      render(<ResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('📋 How to