import React, { useState } from 'react';

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
            className={`btn btn-${variant} btn-${size} ${clicked ? 'clicked' : ''}`}
            onClick={handleClick}
            disabled={disabled || loading}
            aria-busy={loading}
        >
            {loading ? <span className="spinner" /> : icon}
            {label}
        </button>
    );
};
