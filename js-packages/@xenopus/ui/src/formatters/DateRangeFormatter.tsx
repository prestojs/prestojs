import React from 'react';
import DateFormatter from './DateFormatter';

export default function DateRangeFormatter({
    lowerBound,
    upperBound,
    separator,
    ...rest
}: {
    lowerBound: Date;
    upperBound: Date;
    separator: string;
}): string {
    return `${DateFormatter({ value: lowerBound })}${separator}${DateFormatter({
        value: upperBound,
    })}`;
}
