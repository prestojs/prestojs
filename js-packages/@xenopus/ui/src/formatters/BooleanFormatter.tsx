import React from 'react';

export default function BooleanFormatter({
    value,
    blankLabel = 'Unknown',
}: {
    value?: boolean;
    blankLabel: string;
}): string {
    return value ? 'Yes' : value === false ? 'No' : blankLabel;
}
