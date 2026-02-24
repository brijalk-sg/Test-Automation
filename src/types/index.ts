export interface PropInfo {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
}

export interface HookInfo {
    name: string;
    args?: string;
}

export interface ComponentAnalysis {
    componentName: string;
    props: PropInfo[];
    hooks: HookInfo[];
    stateVariables: string[];
    eventHandlers: string[];
    conditionalRenders: string[];
    hasChildren: boolean;
    rawCode: string;
}

export interface StoryVariant {
    name: string;
    args: Record<string, unknown>;
}

export interface StoryAnalysis {
    componentName: string;
    stories: StoryVariant[];
}

export type TestCategory = 'unit' | 'edge' | 'a11y';
export type Priority = 'high' | 'medium' | 'low';

export interface TestSuggestion {
    id: string;
    category: TestCategory;
    title: string;
    description: string;
    code: string;
    priority: Priority;
}

export interface GenerationResult {
    componentName: string;
    unitTests: TestSuggestion[];
    edgeCases: TestSuggestion[];
    a11yTests: TestSuggestion[];
    generatedAt: string;
}
