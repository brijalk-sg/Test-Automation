import React, { useState } from "react";
import type { TestSuggestion, TestCategory } from "../types";
import { TestCard } from "./TestCard";
import { CategoryTabs } from "./CategoryTabs";

function stripImports(code: string): string {
  return code
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return (
        !trimmed.startsWith("import ") && !trimmed.startsWith("expect.extend(")
      );
    })
    .join("\n")
    .replace(/^\n+/, "");
}

function mergeImports(tests: TestSuggestion[], componentName: string): string {
  // Map of module path -> set of named exports
  const namedImports: Record<string, Set<string>> = {};
  // Set of side-effect imports like import '@testing-library/jest-dom'
    const sideEffectImports = new Set<string>();
    
  // Default imports: module -> default name
  const defaultImports: Record<string, string> = {};

  const allCode = tests.map((t) => t.code).join("\n");
  const lines = allCode.split("\n");

  // Patterns for the component's own import (to skip duplicates)
  const componentImportPattern = `./${componentName}`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("import ")) continue;

    // Skip component's own import — we add it once at the end
    if (trimmed.includes(componentImportPattern)) continue;

    // Side-effect: import 'module'  or  import "module"
    const sideEffect = trimmed.match(/^import\s+['"]([^'"]+)['"]/);
    if (sideEffect) {
      sideEffectImports.add(sideEffect[1]);
      continue;
    }

    // Named: import { a, b } from 'module'
    const named = trimmed.match(
      /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
    );
    if (named) {
      const module = named[2];
      const exports = named[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!namedImports[module]) namedImports[module] = new Set();
      exports.forEach((e) => namedImports[module].add(e));
      continue;
    }

    // Default: import Name from 'module'
    const def = trimmed.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
    if (def) {
      defaultImports[def[2]] = def[1];
      continue;
    }

    // Default + named: import Name, { a, b } from 'module'
    const both = trimmed.match(
      /^import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
    );
    if (both) {
      defaultImports[both[3]] = both[1];
      const module = both[3];
      const exports = both[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!namedImports[module]) namedImports[module] = new Set();
      exports.forEach((e) => namedImports[module].add(e));
    }
  }

  // Ensure defaults
  defaultImports["react"] = "React";
  if (!namedImports["@testing-library/react"])
    namedImports["@testing-library/react"] = new Set();
  ["render", "screen", "fireEvent", "waitFor"].forEach((e) =>
    namedImports["@testing-library/react"].add(e),
  );
  sideEffectImports.add("@testing-library/jest-dom");

  // Build output lines
  const result: string[] = [];

  // Default imports (that don't also have named imports)
  for (const [mod, name] of Object.entries(defaultImports)) {
    if (namedImports[mod]) {
      const names = Array.from(namedImports[mod]).join(", ");
      result.push(`import ${name}, { ${names} } from '${mod}';`);
      delete namedImports[mod];
    } else {
      result.push(`import ${name} from '${mod}';`);
    }
  }

  // Remaining named imports
  for (const [mod, names] of Object.entries(namedImports)) {
    result.push(`import { ${Array.from(names).join(", ")} } from '${mod}';`);
  }

  // Side-effect imports
  for (const mod of sideEffectImports) {
    result.push(`import '${mod}';`);
  }

  // Component import
  result.push(`import { ${componentName} } from './${componentName}';`);

  return result.join("\n");
}

function buildTestFile(componentName: string, tests: TestSuggestion[]): string {
  const header = mergeImports(tests, componentName);

  // Check if jest-axe is used — add expect.extend once after imports
  const allCode = tests.map((t) => t.code).join("\n");
  const hasJestAxe = allCode.includes("toHaveNoViolations");
  const axeSetup = hasJestAxe ? "\n\nexpect.extend(toHaveNoViolations);" : "";

  const testBlocks = tests
    .map((t) => {
      const cleanCode = stripImports(t.code);
      return `\n// [${t.priority.toUpperCase()}] ${t.description}\n${cleanCode}`;
    })
    .join("\n");

  return `${header}${axeSetup}\n${testBlocks}\n`;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [showSetup, setShowSetup] = useState(false);

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
          <p>
            Paste your component code, enter your API key, and click{" "}
            <strong>Generate Tests</strong> to see AI-generated test
            suggestions.
          </p>
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
    activeTab === "unit"
      ? results.unitTests
      : activeTab === "edge"
        ? results.edgeCases
        : results.a11yTests;

  const allTests = [
    ...results.unitTests,
    ...results.edgeCases,
    ...results.a11yTests,
  ];
  const name = componentName || "Component";

  const handleDownload = () => {
    const content = buildTestFile(name, allTests);
    downloadFile(`${name}.test.tsx`, content);
  };

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2 className="results-title">
          ✨ Results for <span className="component-name">{name}</span>
        </h2>
        <span className="total-badge">
          {counts.unit + counts.edge + counts.a11y} tests
        </span>
      </div>

      <div className="results-actions">
        <button className="download-btn" onClick={handleDownload}>
          📥 Download .test.tsx
        </button>
        <button className="setup-btn" onClick={() => setShowSetup(!showSetup)}>
          {showSetup ? "✕ Hide Setup" : "📋 How to Use"}
        </button>
      </div>

      {showSetup && (
        <div className="setup-guide">
          <h3 className="setup-title">How to Integrate in Any React Project</h3>
          <div className="setup-steps">
            <div className="setup-step">
              <span className="step-number">1</span>
              <div>
                <p className="step-heading">Install test dependencies</p>
                <p className="step-desc">
                  Run this in your project's root directory:
                </p>
                <code className="step-code">
                  npm install --save-dev jest ts-jest jest-environment-jsdom
                  @testing-library/react @testing-library/jest-dom
                  @testing-library/user-event @types/jest jest-axe
                  @types/jest-axe
                </code>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">2</span>
              <div>
                <p className="step-heading">
                  Create <code>jest.config.ts</code> in project root
                </p>
                <pre className="step-code-block">{`export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/jest-globals'],
};`}</pre>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">3</span>
              <div>
                <p className="step-heading">
                  Add test script to <code>package.json</code>
                </p>
                <pre className="step-code-block">{`"scripts": {
  "test": "jest"
}`}</pre>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">4</span>
              <div>
                <p className="step-heading">Generate tests using this app</p>
                <p className="step-desc">
                  Paste your React component code into the editor on the left,
                  enter your Claude API key, and click{" "}
                  <strong>Generate Tests</strong>. The AI will analyze your
                  component and produce unit tests, edge cases, and
                  accessibility tests.
                </p>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">5</span>
              <div>
                <p className="step-heading">
                  Download &amp; place the test file
                </p>
                <p className="step-desc">
                  Click <strong>"Download .test.tsx"</strong> above. Place the
                  downloaded file next to your component:
                </p>
                <pre className="step-code-block">{`src/
  components/
    ${name}.tsx          ← your component
    ${name}.test.tsx     ← downloaded test file (place here)`}</pre>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">6</span>
              <div>
                <p className="step-heading">Run the tests</p>
                <code className="step-code">npx jest {name}.test.tsx</code>
                <p className="step-desc" style={{ marginTop: "8px" }}>
                  Or run all tests: <code>npm test</code>
                </p>
              </div>
            </div>
          </div>
          <div className="setup-notes">
            <p className="setup-note">
              <strong>Next.js:</strong> Use <code>next/jest</code> instead of
              the jest.config above — it handles transforms automatically.
            </p>
            <p className="setup-note">
              <strong>Vite + Vitest:</strong> If you prefer Vitest, replace Jest
              with <code>npm i -D vitest @testing-library/react</code> and use{" "}
              <code>npx vitest</code>. The generated test code is compatible
              with both.
            </p>
            <p className="setup-note">
              <strong>Tip:</strong> Some AI-generated tests may need minor
              adjustments based on your component's actual behavior. Review and
              tweak as needed.
            </p>
          </div>
        </div>
      )}

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
