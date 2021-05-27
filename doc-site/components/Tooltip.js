import React from 'react';

export default function Tooltip({ children, content }) {
    return (
        <div className="tooltip-container">
            {children}
            <div className="tooltip">{content}</div>
        </div>
    );
}
