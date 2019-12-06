import React from 'react';
import NumberFormatter from './DateTimeFormatter';

export default function NumberRangeFormatter({
    lowerBound,
    upperBound,
    separator,
}: {
    lowerBound: Date;
    upperBound: Date;
    separator: string;
}): string {
    return `${NumberFormatter({ value: lowerBound })}${separator}${NumberFormatter({
        value: upperBound,
    })}`;
}
