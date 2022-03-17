import React from 'react';

export default function Tooltip({
    children,
    content,
    position,
}: {
    children: React.ReactNode;
    content: React.ReactNode;
    position?: 'left';
}) {
    return (
        <div className="tooltip-container cursor-pointer">
            {children}
            <div className={`tooltip${position === 'left' ? ' -left-80' : ''}`}>{content}</div>
        </div>
    );
}
