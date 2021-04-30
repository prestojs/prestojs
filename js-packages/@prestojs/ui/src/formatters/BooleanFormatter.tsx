import React, { ReactElement, ReactNode } from 'react';

/**
 * @expand-properties
 */
type BooleanFormatterProps = {
    /**
     * The value to format. When null or undefined renders `blankLabel`, when truthy renders `trueLabel`, when falsy renders 'falseLabel`
     */
    value?: boolean | null;
    /**
     * Rendered when `value` is null or undefined
     *
     * Defaults to empty string
     */
    blankLabel?: ReactNode;
    /**
     * Rendered when `value` is truthy
     *
     * Defaults to `Yes`
     */
    trueLabel?: ReactNode;
    /**
     * Rendered when `value` is falsy
     *
     * Defaults to `No`
     */
    falseLabel?: ReactNode;
};

/**
 * Format a boolean for display
 *
 * Displays truthy value as `Yes`, `false` as `No` and null/undefined
 * as `blankLabel` (defaults to empty string).
 *
 * This is the [default formatter](doc:getFormatterForField) used for [BooleanField](doc:BooleanField) and [NullableBooleanField](doc:NullableBooleanField).
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function BooleanFormatter(props: BooleanFormatterProps): ReactElement {
    const { value, blankLabel = '', trueLabel = 'Yes', falseLabel = 'No' } = props;
    if (value == null || ((value as unknown) as string) === '') {
        return <>{blankLabel}</>;
    }
    return <>{value ? trueLabel : falseLabel}</>;
}
