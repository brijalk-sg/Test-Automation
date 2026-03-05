import React, { useState } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { FileUpload } from './components/FileUpload';
import { ApiKeyInput } from './components/ApiKeyInput';
import { ResultsPanel } from './components/ResultsPanel';
import { analyzeComponent } from './lib/analyzer';
import {
    buildUnitTestPrompt,
    buildEdgeCasePrompt,
    buildA11yPrompt,
} from './lib/promptBuilder';
import { generateTests } from './lib/claude';
import type { TestSuggestion, TestCategory } from './types';

const SAMPLE_CODE = `import React, { useState } from 'react';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    setClicked(true);
    onClick?.();
    setTimeout(() => setClicked(false), 200);
  };

  return (
    <button
      className={\`btn btn-\${variant} btn-\${size} \${clicked ? 'clicked' : ''}\`}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <span className="spinner" /> : icon}
      {label}
    </button>
  );
};`;

function App() {
    const [code, setCode] = useState('');
    const [storiesCode, setStoriesCode] = useState('');
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_CLAUDE_API_KEY || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TestCategory>('unit');
    const [results, setResults] = useState<{
        unitTests: TestSuggestion[];
        edgeCases: TestSuggestion[];
        a11yTests: TestSuggestion[];
    } | null>(null);
    const [componentName, setComponentName] = useState('');

    const handleFileLoaded = (content: string, fileName: string) => {
        if (fileName.includes('.stories.')) {
            setStoriesCode(content);
        } else {
            setCode(content);
        }
    };

    const handleLoadSample = () => {
        setCode(SAMPLE_CODE);
    };

    const handleGenerate = async () => {
        if (!code.trim()) {
            setError('Please paste your component code first.');
            return;
        }
        if (!apiKey.trim()) {
            setError('Please enter your Claude API key.');
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const analysis = analyzeComponent(code);
            setComponentName(analysis.componentName);

            const unitPrompt = buildUnitTestPrompt(analysis, storiesCode || undefined);
            const edgePrompt = buildEdgeCasePrompt(analysis);
            const a11yPrompt = buildA11yPrompt(analysis);

            const [unitTests, edgeCases, a11yTests] = await Promise.all([
                generateTests(apiKey, unitPrompt, 'unit'),
                generateTests(apiKey, edgePrompt, 'edge'),
                generateTests(apiKey, a11yPrompt, 'a11y'),
            ]);

            setResults({ unitTests, edgeCases, a11yTests });
            setActiveTab('unit');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(`Failed to generate tests: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <Header />
            <main className="main-layout">
                {/* LEFT PANEL — Input */}
                <section className="input-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">📝 Input</h2>
                        <button className="sample-btn" onClick={handleLoadSample}>
                            Load Sample
                        </button>
                    </div>

                    <FileUpload onFileLoaded={handleFileLoaded} />

                    <CodeEditor
                        code={code}
                        onCodeChange={setCode}
                        placeholder="Paste your React component code here..."
                    />

                    {storiesCode && (
                        <div className="stories-indicator">
                            ✅ Storybook stories loaded
                            <button
                                className="clear-stories"
                                onClick={() => setStoriesCode('')}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />

                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={loading || !code.trim() || !apiKey.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="btn-spinner"></span> Generating...
                            </>
                        ) : (
                            <>⚡ Generate Test Cases</>
                        )}
                    </button>
                </section>

                {/* RIGHT PANEL — Results */}
                <section className="output-panel">
                    <ResultsPanel
                        results={results}
                        loading={loading}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        componentName={componentName}
                    />
                </section>
            </main>
        </div>
    );
}

export default App;
