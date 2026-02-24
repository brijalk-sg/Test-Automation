import type { ComponentAnalysis } from '../types';

/**
 * Builds AI prompts from component analysis data.
 */

function formatComponentContext(analysis: ComponentAnalysis): string {
    const parts: string[] = [];

    parts.push(`Component Name: ${analysis.componentName}`);

    if (analysis.props.length > 0) {
        parts.push(`\nProps:`);
        analysis.props.forEach(p => {
            parts.push(`  - ${p.name}: ${p.type} (${p.required ? 'required' : 'optional'})`);
        });
    }

    if (analysis.hooks.length > 0) {
        parts.push(`\nHooks Used: ${analysis.hooks.map(h => h.name).join(', ')}`);
    }

    if (analysis.stateVariables.length > 0) {
        parts.push(`\nState Variables: ${analysis.stateVariables.join(', ')}`);
    }

    if (analysis.eventHandlers.length > 0) {
        parts.push(`\nEvent Handlers: ${analysis.eventHandlers.join(', ')}`);
    }

    if (analysis.conditionalRenders.length > 0) {
        parts.push(`\nConditional Rendering:`);
        analysis.conditionalRenders.forEach(c => {
            parts.push(`  - ${c}`);
        });
    }

    if (analysis.hasChildren) {
        parts.push(`\nAccepts Children: yes`);
    }

    return parts.join('\n');
}

export function buildUnitTestPrompt(analysis: ComponentAnalysis, storiesCode?: string): string {
    let prompt = `You are an expert React testing engineer. Analyze the following React component and generate comprehensive unit test suggestions using Jest and React Testing Library.

## Component Analysis
${formatComponentContext(analysis)}

## Full Component Code
\`\`\`tsx
${analysis.rawCode}
\`\`\`
`;

    if (storiesCode) {
        prompt += `
## Storybook Stories
\`\`\`tsx
${storiesCode}
\`\`\`
`;
    }

    prompt += `
## Instructions
Generate 5-8 unit test cases. For each test, provide:
1. A clear title
2. A brief description of what it tests and why
3. Complete, runnable test code using Jest + React Testing Library
4. Priority: "high", "medium", or "low"

Focus on:
- Rendering with different prop combinations
- User interactions (clicks, typing, etc.)
- State changes and side effects
- Props callbacks being called correctly
- Conditional rendering paths

Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "test title",
    "description": "what this tests",
    "code": "test code here",
    "priority": "high"
  }
]`;

    return prompt;
}

export function buildEdgeCasePrompt(analysis: ComponentAnalysis): string {
    return `You are an expert React testing engineer specializing in edge cases and boundary testing. Analyze the following React component and generate edge case test suggestions.

## Component Analysis
${formatComponentContext(analysis)}

## Full Component Code
\`\`\`tsx
${analysis.rawCode}
\`\`\`

## Instructions
Generate 5-8 edge case test scenarios. Think about:
- Undefined/null/empty values for all props
- Boundary values (empty strings, very long strings, zero, negative numbers)
- Rapid user interactions (double-click, fast typing)
- Missing optional props
- Invalid prop types
- Component unmounting during async operations
- Error states and error boundaries
- Re-rendering with changed props
- Ref forwarding edge cases

For each test, provide:
1. A clear title
2. A description explaining the edge case and why it matters
3. Complete, runnable test code using Jest + React Testing Library
4. Priority: "high", "medium", or "low"

Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "test title",
    "description": "what edge case this covers",
    "code": "test code here",
    "priority": "high"
  }
]`;
}

export function buildA11yPrompt(analysis: ComponentAnalysis): string {
    return `You are an expert in web accessibility (WCAG 2.1) and React testing. Analyze the following React component and generate accessibility test suggestions.

## Component Analysis
${formatComponentContext(analysis)}

## Full Component Code
\`\`\`tsx
${analysis.rawCode}
\`\`\`

## Instructions
Generate 5-8 accessibility test cases. Focus on:
- Proper ARIA roles and attributes
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management and focus trapping
- Screen reader compatibility (aria-label, aria-describedby, aria-live)
- Color contrast and visual indicators
- Form labels and error messages
- Semantic HTML usage
- Touch target sizes
- Reduced motion preferences

For each test, provide:
1. A clear title
2. A description explaining the accessibility requirement (reference WCAG criteria if applicable)
3. Complete, runnable test code using Jest + React Testing Library (use jest-axe where appropriate)
4. Priority: "high", "medium", or "low"

Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "test title",
    "description": "accessibility requirement this tests",
    "code": "test code here",
    "priority": "high"
  }
]`;
}
