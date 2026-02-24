import React from 'react';
import type { TestSuggestion, TestCategory } from '../types';
import { TestCard } from './TestCard';
import { CategoryTabs } from './CategoryTabs';

interface ResultsPanelProps {
    results: {
        unitTests: TestSuggestion[];
        edgeCases: TestSuggestion[];
        a11yTests: TestSuggestion[];
    } | null;
    loading: boolean;
    activeTab: TestCategory;
    onTabChange: (tab: TestCategory) => void;
    componentName?: string;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
    results,
    loading,
    activeTab,
    onTabChange,
    componentName,
}) => {
    if (loading) {
        return (
            <div className="results-panel">
                <div className="results-loading">
                    <div className="spinner"></div>
                    <p className="loading-text">Generating test cases with AI...</p>
                    <p className="loading-hint">This may take 10-20 seconds</p>
                    <div className="loading-steps">
                        <div className="step active">🔍 Analyzing component</div>
                        <div className="step active">🧠 Building prompts</div>
                        <div className="step pulse">⚡ Calling AI model</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="results-panel">
                <div className="results-empty">
                    <span className="empty-icon">🧪</span>
                    <h3>No results yet</h3>
                    <p>Paste your component code, enter your API key, and click <strong>Generate Tests</strong> to see AI-generated test suggestions.</p>
                </div>
            </div>
        );
    }

    const counts = {
        unit: results.unitTests.length,
        edge: results.edgeCases.length,
        a11y: results.a11yTests.length,
    };

    const currentTests: TestSuggestion[] =
        activeTab === 'unit'
            ? results.unitTests
            : activeTab === 'edge'
                ? results.edgeCases
                : results.a11yTests;

    return (
        <div className="results-panel">
            <div className="results-header">
                <h2 className="results-title">
                    ✨ Results for <span className="component-name">{componentName || 'Component'}</span>
                </h2>
                <span className="total-badge">
                    {counts.unit + counts.edge + counts.a11y} tests
                </span>
            </div>

            <CategoryTabs
                activeTab={activeTab}
                onTabChange={onTabChange}
                counts={counts}
            />

            <div className="test-cards-list">
                {currentTests.length > 0 ? (
                    currentTests.map((test) => <TestCard key={test.id} test={test} />)
                ) : (
                    <p className="no-tests">No tests generated for this category.</p>
                )}
            </div>
        </div>
    );
};
