import React, { useState } from 'react';
import type { TestSuggestion } from '../types';

interface TestCardProps {
    test: TestSuggestion;
}

const priorityConfig = {
    high: { emoji: '🔴', label: 'High', className: 'priority-high' },
    medium: { emoji: '🟡', label: 'Medium', className: 'priority-medium' },
    low: { emoji: '🟢', label: 'Low', className: 'priority-low' },
};

export const TestCard: React.FC<TestCardProps> = ({ test }) => {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const priority = priorityConfig[test.priority];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(test.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`test-card ${priority.className}`}>
            <div className="test-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="test-card-title-row">
                    <span className={`priority-badge ${priority.className}`}>
                        {priority.emoji} {priority.label}
                    </span>
                    <h3 className="test-card-title">{test.title}</h3>
                </div>
                <button
                    className="expand-btn"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    {expanded ? '▲' : '▼'}
                </button>
            </div>
            <p className="test-card-description">{test.description}</p>
            {expanded && (
                <div className="test-card-code-section">
                    <div className="code-header">
                        <span className="code-lang">TypeScript / Jest</span>
                        <button className="copy-btn" onClick={handleCopy}>
                            {copied ? '✅ Copied!' : '📋 Copy'}
                        </button>
                    </div>
                    <pre className="code-block">
                        <code>{test.code}</code>
                    </pre>
                </div>
            )}
        </div>
    );
};
