import React from 'react';
import DateTimeFormatter from './DateTimeFormatter';

export default function DateTimeRangeFormatter({
    lowerBound,
    upperBound,
    separator,
}: {
    lowerBound: Date;
    upperBound: Date;
    separator: string;
}): string {
    return `${DateTimeFormatter({ value: lowerBound })}${separator}${DateTimeFormatter({
        value: upperBound,
    })}`;
}
