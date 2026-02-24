import React from 'react';
import type { TestCategory } from '../types';

interface CategoryTabsProps {
    activeTab: TestCategory;
    onTabChange: (tab: TestCategory) => void;
    counts: { unit: number; edge: number; a11y: number };
}

const tabs: { key: TestCategory; label: string; icon: string }[] = [
    { key: 'unit', label: 'Unit Tests', icon: '🧪' },
    { key: 'edge', label: 'Edge Cases', icon: '⚠️' },
    { key: 'a11y', label: 'Accessibility', icon: '♿' },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
    activeTab,
    onTabChange,
    counts,
}) => {
    return (
        <div className="category-tabs" role="tablist">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    className={`category-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.key)}
                >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                    {counts[tab.key] > 0 && (
                        <span className="tab-count">{counts[tab.key]}</span>
                    )}
                </button>
            ))}
        </div>
    );
};
