import React, { ComponentProps, ReactNode } from 'react';

function DefaultFormatter<T>({
    value,
    blankLabel,
}: {
    value: T | null;
    /**
     * What to render when `value` is `null` or `undefined`
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
}): React.ReactElement {
    if (!value) {
        return <>{blankLabel}</>;
    }
    return <>{value}</>;
}

/**
 * @expandproperties
 */
export interface RangeValue<T> {
    /**
     * The lower value of the range
     */
    lower: T | null;
    /**
     * The upper value of the range
     */
    upper: T | null;
}

/**
 * @expandproperties
 */
export type RangeFormatterProps<
    T,
    BoundsFormatter extends React.ComponentType<{ value: T | null }>
> = {
    /**
     * The range value. This should be an object with a `lower` and `upper` key representing the lower and upper
     * bounds of the range respectively.
     */
    value?: RangeValue<T> | null;
    /**
     * What to render when `value` is `null` or `undefined`
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * The formatter to use to render the `lower` and `upper` values in `value`.
     *
     * If not specified then defaults to returning the `value` directly.
     */
    boundsFormatter?: BoundsFormatter;
    /**
     * Any props to pass through to `boundsFormatter`.
     *
     * @typename BoundsFormatter Props
     */
    boundsFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * Any props to pass through to the lower `boundsFormatter`. If `boundsFormatter` is also passed then
     * both will be passed through with `lowerFormatterProps` taking precedence.
     *
     * @typename BoundsFormatter Props
     */
    lowerFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * Any props to pass through to the upper `boundsFormatter`. If `boundsFormatter` is also passed then
     * both will be passed through with `upperFormatterProps` taking precedence.
     *
     * @typename BoundsFormatter Props
     */
    upperFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * The separator to render between the `lower` and `upper` values. Defaults to `~`.
     */
    separator?: React.ReactNode;
};

/**
 * Format a range for display
 *
 * This is the [default formatter](doc:getFormatterForField) used for [RangeField](doc:BooleanField), and any field that
 * extends `RangeField`. The `boundsFormatter` will be selected based on the `boundsField` specified on `RangeField. For
 * example, [DateRangeField](doc:DateRangeField) will use [DateFormatter](doc:DateFormatter) for `boundsFormatter`.
 *
 * <Usage>
 *     Basic usage just requires passing the value through:
 *
 *    ```js
 *    <RangeFormatter value={{ lower: 1, upper: 2 }} />
 *    ```
 *
 *    To control how each end of the range is formatted, pass in a formatter to `boundsFormatter`:
 *
 *    ```js
 *    <RangeFormatter value={{ lower: 1, upper: 2 }} boundsFormatter={NumberFormatter} />
 *    ```
 *
 *    If no value is provided `blankLabel` is returned:
 *
 *    ```js
 *    <RangeFormatter value={null} blankLabel={<em>None</em>} />
 *    ```
 *
 *    Or if one of the bounds is not provided, specify `blankLabel` in `boundsFormatterProps`:
 *
 *    ```js
 *    <RangeFormatter
 *      value={{ lower: 1, upper: null }}
 *      boundsFormatterProps={{ blankLabel: '∞' }}
 *    />
 *    ```
 *
 *    Any additional props for the `boundsFormatter` can also be passed there:
 *
 *    ```js
 *    <RangeFormatter
 *      value={{ lower: 50, upper: 100 }}
 *      boundsFormatterProps={{ localeOptions: { style: 'currency', currency: 'USD' } }}
 *      boundsFormatter={NumberFormatter}
 *    />
 *    ```
 * </Usage>
 *
 * @extractdocs
 * @menugroup Formatters
 */
export default function RangeFormatter<
    T,
    BoundsFormatter extends React.ComponentType<{ value: T | null }> = typeof DefaultFormatter
>(props: RangeFormatterProps<T, BoundsFormatter>): React.ReactElement {
    const {
        blankLabel,
        value,
        boundsFormatter: BoundsFormatter = DefaultFormatter,
        boundsFormatterProps = {},
        lowerFormatterProps = {},
        upperFormatterProps = {},
        separator = '~',
    } = props;
    if (!value) {
        return <>{blankLabel}</>;
    }
    const { lower, upper } = value;
    return (
        <React.Fragment>
            <BoundsFormatter value={lower} {...boundsFormatterProps} {...lowerFormatterProps} />{' '}
            {separator}{' '}
            <BoundsFormatter value={upper} {...boundsFormatterProps} {...upperFormatterProps} />
        </React.Fragment>
    );
}
