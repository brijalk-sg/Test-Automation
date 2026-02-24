import React, { useRef, useState } from 'react';

interface CodeEditorProps {
    code: string;
    onCodeChange: (code: string) => void;
    placeholder?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    code,
    onCodeChange,
    placeholder,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const lineCount = code ? code.split('\n').length : 0;

    return (
        <div className={`code-editor ${isFocused ? 'focused' : ''}`}>
            <div className="code-editor-header">
                <div className="editor-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                </div>
                <span className="editor-title">Component Code</span>
                <span className="editor-meta">
                    {lineCount > 0 ? `${lineCount} lines` : ''}
                </span>
            </div>
            <div className="code-editor-body">
                <div className="line-numbers" aria-hidden="true">
                    {code.split('\n').map((_, i) => (
                        <span key={i}>{i + 1}</span>
                    ))}
                    {!code && <span>1</span>}
                </div>
                <textarea
                    ref={textareaRef}
                    className="code-textarea"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder || 'Paste your React component code here...'}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                />
            </div>
        </div>
    );
};
