import React from 'react';

export default function RangeFormatter<T>({
    lowerBound,
    upperBound,
    baseFormatter: BaseFormatter,
    separator = '~',
}: {
    lowerBound: T;
    upperBound: T;
    baseFormatter: React.ComponentType<{ value: T }> | string;
    separator: string;
}): React.ReactElement {
    return (
        <React.Fragment>
            <BaseFormatter value={lowerBound} />
            {separator}
            <BaseFormatter value={upperBound} />
        </React.Fragment>
    );
}
