import React, { useState } from 'react';

interface ApiKeyInputProps {
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
    apiKey,
    onApiKeyChange,
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="api-key-input">
            <label className="api-key-label" htmlFor="api-key">
                <span className="key-icon">🔑</span> Claude API Key
            </label>
            <div className="api-key-field">
                <input
                    id="api-key"
                    type={visible ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="sk-ant-..."
                    className="api-key-text-input"
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? 'Hide API key' : 'Show API key'}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
            <p className="api-key-hint">Your key stays in your browser — never sent to our servers.</p>
        </div>
    );
};
