import React from 'react';

export default function LinkFormatter({
    value,
    children,
    ...rest
}: {
    value: string;
    children?: React.ReactNode;
}): React.ReactElement {
    return (
        <a href={value} {...rest}>
            {children || value}
        </a>
    );
}
