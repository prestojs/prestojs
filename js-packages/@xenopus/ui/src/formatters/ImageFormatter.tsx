import React from 'react';

export default function ImageFormatter({
    value,
    ...rest
}: {
    value?: string;
}): React.ReactElement | null {
    if (!value) return null;

    return <img src={value} {...rest} />;
}
