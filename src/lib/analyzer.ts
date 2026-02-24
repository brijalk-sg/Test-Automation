import type { ComponentAnalysis } from '../types';

/**
 * Analyzes React component source code and extracts structured metadata.
 * Uses regex-based parsing (no AST dependency needed in browser).
 */
export function analyzeComponent(code: string): ComponentAnalysis {
    const componentName = extractComponentName(code);
    const props = extractProps(code);
    const hooks = extractHooks(code);
    const stateVariables = extractStateVariables(code);
    const eventHandlers = extractEventHandlers(code);
    const conditionalRenders = extractConditionalRenders(code);
    const hasChildren = /children/i.test(code) || /\{children\}/.test(code);

    return {
        componentName,
        props,
        hooks,
        stateVariables,
        eventHandlers,
        conditionalRenders,
        hasChildren,
        rawCode: code,
    };
}

function extractComponentName(code: string): string {
    // Match: export default function ComponentName / const ComponentName = / function ComponentName
    const patterns = [
        /export\s+default\s+function\s+(\w+)/,
        /export\s+function\s+(\w+)/,
        /(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:React\.)?(?:FC|FunctionComponent|memo|forwardRef)/,
        /(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*(?::\s*\w+)?\s*=>/,
        /function\s+(\w+)\s*\(/,
    ];

    for (const pattern of patterns) {
        const match = code.match(pattern);
        if (match && match[1] && match[1][0] === match[1][0].toUpperCase()) {
            return match[1];
        }
    }
    return 'UnknownComponent';
}

function extractProps(code: string) {
    const props: ComponentAnalysis['props'] = [];

    // Match interface Props { ... } or type Props = { ... }
    const interfaceMatch = code.match(
        /(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s
    );

    if (interfaceMatch) {
        const propsBlock = interfaceMatch[1];
        // Match individual prop lines like: name: string; or name?: string;
        const propRegex = /(\w+)(\?)?:\s*([^;,\n]+)/g;
        let match;
        while ((match = propRegex.exec(propsBlock)) !== null) {
            props.push({
                name: match[1],
                type: match[3].trim(),
                required: !match[2],
            });
        }
    }

    // Also try destructured props: ({ name, age, ...rest }: Props)
    const destructuredMatch = code.match(
        /\(\s*\{\s*([^}]+)\}\s*:\s*\w+/
    );
    if (destructuredMatch && props.length === 0) {
        const names = destructuredMatch[1].split(',').map(s => s.trim().split('=')[0].trim().replace('...', ''));
        names.forEach(name => {
            if (name && !props.find(p => p.name === name)) {
                props.push({ name, type: 'unknown', required: true });
            }
        });
    }

    return props;
}

function extractHooks(code: string) {
    const hooks: ComponentAnalysis['hooks'] = [];
    const hookRegex = /use(\w+)\s*\(/g;
    let match;
    const seen = new Set<string>();

    while ((match = hookRegex.exec(code)) !== null) {
        const name = `use${match[1]}`;
        if (!seen.has(name)) {
            seen.add(name);
            hooks.push({ name });
        }
    }
    return hooks;
}

function extractStateVariables(code: string) {
    const states: string[] = [];
    const stateRegex = /\[\s*(\w+)\s*,\s*set\w+\s*\]\s*=\s*useState/g;
    let match;
    while ((match = stateRegex.exec(code)) !== null) {
        states.push(match[1]);
    }
    return states;
}

function extractEventHandlers(code: string) {
    const handlers: string[] = [];
    // Match onClick, onSubmit, onChange, etc.
    const handlerRegex = /on(\w+)\s*[=:]/g;
    let match;
    const seen = new Set<string>();

    while ((match = handlerRegex.exec(code)) !== null) {
        const name = `on${match[1]}`;
        if (!seen.has(name)) {
            seen.add(name);
            handlers.push(name);
        }
    }
    return handlers;
}

function extractConditionalRenders(code: string) {
    const conditionals: string[] = [];

    // Ternary in JSX: {condition ? <A/> : <B/>}
    const ternaryRegex = /\{([^{}]+)\s*\?\s*[^{}]+\s*:\s*[^{}]+\}/g;
    let match;
    while ((match = ternaryRegex.exec(code)) !== null) {
        conditionals.push(`Ternary: ${match[1].trim()}`);
    }

    // Short-circuit: {condition && <Component/>}
    const shortCircuitRegex = /\{([^{}]+)\s*&&\s*[<(]/g;
    while ((match = shortCircuitRegex.exec(code)) !== null) {
        conditionals.push(`Conditional: ${match[1].trim()}`);
    }

    return conditionals;
}
