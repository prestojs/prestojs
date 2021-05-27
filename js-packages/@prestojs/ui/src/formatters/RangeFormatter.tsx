import React, { ComponentProps, ReactNode } from 'react';

function DefaultFormatter<T>({ value }: { value: T | null }): React.ReactElement {
    return <>{value}</>;
}

/**
 * @expand-properties
 */
interface RangeValue<T> {
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
 * @expand-properties
 */
type RangeFormatterProps<T, BoundsFormatter extends React.ComponentType<{ value: T | null }>> = {
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
     * @type-name BoundsFormatter Props
     */
    boundsFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * Any props to pass through to the lower `boundsFormatter`. If `boundsFormatter` is also passed then
     * both will be passed through with `lowerFormatterProps` taking precedence.
     *
     * @type-name BoundsFormatter Props
     */
    lowerFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * Any props to pass through to the upper `boundsFormatter`. If `boundsFormatter` is also passed then
     * both will be passed through with `upperFormatterProps` taking precedence.
     *
     * @type-name BoundsFormatter Props
     */
    upperFormatterProps?: ComponentProps<BoundsFormatter>;
    /**
     * The separator to render between the `lower` and `upper` values. Defaults to `~`.
     */
    separator?: React.ReactNode;
};

/**
 * Formats a range.
 *
 * If no value is provided `blankLabel` is returned.
 *
 * The `lower` and `upper` values are rendered using `boundsFormatter`. If `boundsFormatter` is not provided then the value
 * will be returned as is. You can pass extra props to the formatters specifically using `boundsFormatterProps` (both upper
 * and lower), `lowerFormatterProps` (lower only) and `upperFormatterProps` (upper only).
 *
 * This is the [default formatter](doc:getFormatterForField) used for [DateRangeField](doc:DateRangeField), [DateTimeRangeField](doc:DateTimeRangeFiel),
 * [FloatRangeField](doc:FloatRangeField) and [IntegerRangeField](doc:IntegerRangeField).
 *
 * @extract-docs
 * @menu-group Formatters
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
