import React from 'react';

export default function NumberFormatter({
    value,
    locales = [],
    localeOptions,
    ...rest
}: {
    value: number | null;
    locales?: string | Array<string>;
    localeOptions?: {
        localeMatcher?: string;
        style?: string;
        currency?: string;
        currencyDisplay?: string;
        useGrouping?: boolean;
        minimumIntegerDigits?: number;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        minimumSignificantDigits?: number;
        maximumSignificantDigits?: number;
    };
}): string | null {
    if (value == null) {
        return value;
    }
    let finalValue = value;
    if (typeof value != 'number') {
        finalValue = Number(value);
    }
    if (Number.isNaN(finalValue)) {
        return null;
    }

    return finalValue.toLocaleString(locales, localeOptions);
}
