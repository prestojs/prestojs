import React from 'react';

export default function Tooltip({
    children,
    content,
    position,
    className,
}: {
    children: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    position?: 'left';
}) {
    return (
        <span className={`tooltip-container cursor-pointer${className ? ` ${className}` : ''}`}>
            {children}
            <div className={`tooltip${position === 'left' ? ' -left-80' : ''}`}>{content}</div>
        </span>
    );
}
