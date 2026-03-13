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

// Mock document.createElement and click
const mockClick = jest.fn();
const mockAnchor = {
  href: '',
  download: '',
  click: mockClick,
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

      await user.click(screen.getByText('📋 How to Use'));

      expect(screen.getByText(/TestComponent\.tsx/)).toBeInTheDocument();
      expect(screen.getByText(/TestComponent\.test\.tsx/)).toBeInTheDocument();
    });
  });

  describe('File Download', () => {
    it('should trigger download when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('📥 Download .test.tsx'));

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('TestComponent.test.tsx');
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mocked-url');
    });

    it('should use default component name in filename when componentName is undefined', async () => {
      const user = userEvent.setup();
      render(
        <ResultsPanel
          {...defaultProps}
          componentName={undefined}
        />
      );

      await user.click(screen.getByText('📥 Download .test.tsx'));

      expect(mockAnchor.download).toBe('Component.test.tsx');
    });

    it('should create correct file content with merged imports', async () => {
      const user = userEvent.setup();
      render(<ResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('📥 Download .test.tsx'));

      const createObjectURLCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0];
      const blob = createObjectURLCall[0];
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /how to use/i })).toBeInTheDocument();
    });

    it('should have accessible loading state', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={true}
          results={null}
        />
      );

      expect(screen.getByText('Generating test cases with AI...')).toBeInTheDocument();
    });

    it('should have accessible empty state', () => {
      render(
        <ResultsPanel
          {...defaultProps}
          loading={false}
          results={null}
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'No results yet' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle results with empty arrays', () => {
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

      expect(screen.getByText('0 tests')).toBeInTheDocument();
      expect(screen.getByText('No tests generated for this category.')).toBeInTheDocument();
    });

    it('should handle very long component names', () => {
      const longName = 'VeryLongComponentNameThatMightCauseLayoutIssues';
      render(
        <ResultsPanel
          {...defaultProps}
          componentName={longName}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in component name', () => {
      const specialName = 'Component$WithSpecial_Characters123';
      render(
        <ResultsPanel
          {...defaultProps}
          componentName={specialName}
        />
      );

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain setup guide state independently', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ResultsPanel {...defaultProps} />);

      await user.click(screen.getByText('📋 How to Use'));
      expect(screen.getByText('How to Integrate in Any React Project')).toBeInTheDocument();

      // Re-render with different props
      rerender(
        <ResultsPanel
          {...defaultProps}
          activeTab="edge"
        />
      );

      // Setup guide should still be open
      expect(screen.getByText('How to Integrate in Any React Project')).toBeInTheDocument();
    });
  });
});