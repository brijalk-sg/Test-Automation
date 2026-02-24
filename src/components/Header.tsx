import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">⚡</span>
                        <h1 className="logo-text">TestGen AI</h1>
                    </div>
                    <p className="header-tagline">
                        AI-powered test case generator for React components
                    </p>
                </div>
                <div className="header-badge">
                    <span className="badge">React + Jest + RTL</span>
                </div>
            </div>
        </header>
    );
};
