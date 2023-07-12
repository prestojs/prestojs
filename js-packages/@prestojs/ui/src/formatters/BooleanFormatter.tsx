import React, { ReactElement, ReactNode } from 'react';

/**
 * @expandproperties
 */
export type BooleanFormatterProps = {
    /**
     * The value to format. When `null`, `undefined` or empty string it renders `blankLabel`, when truthy renders `trueLabel`, when falsy renders `falseLabel`
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
     * Rendered when `value` is falsy but not `null`, `undefined` or the empty string
     *
     * Defaults to `No`
     */
    falseLabel?: ReactNode;
};

/**
 * Format a boolean for display
 *
 * Displays truthy value as `Yes`, falsy as `No` and null/undefined/empty string as `blankLabel` (defaults to empty string).
 *
 * This is the [default formatter](doc:getFormatterForField) used for [BooleanField](doc:BooleanField).
 *
 * <Usage>
 *     Basic usage just requires passing the value through:
 *
 *    ```js
 *    <BooleanFormatter value={false} />
 *    ```
 *
 *    You can control what label is rendered each possible value (including blank values, e.g. `null` or `undefined`):
 *
 *    ```js
 *    <BooleanFormatter blankLabel="❓" trueLabel={'✅'} falseLabel={'❌'} value={false} />
 *    ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Formatters
 */
export default function BooleanFormatter(props: BooleanFormatterProps): ReactElement {
    const { value, blankLabel = '', trueLabel = 'Yes', falseLabel = 'No' } = props;
    if (value == null || (value as unknown as string) === '') {
        return <>{blankLabel}</>;
    }
    return <>{value ? trueLabel : falseLabel}</>;
}
