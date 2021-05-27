import React, { ReactNode } from 'react';

/**
 * @expand-properties Any extra props are passed directly through to `linkComponent`
 */
type LinkFormatterProps<T extends React.ComponentType | 'a' = 'a'> = {
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * The link component to use. Defaults to `a`.
     */
    linkComponent?: T;
    /**
     * The URL to link to
     */
    value?: null | string;
    /**
     * The children to pass through to the `linkComponent`.
     */
    children?: React.ReactNode;
} & Omit<T extends 'a' ? JSX.IntrinsicElements['a'] : React.ComponentProps<T>, 'href'>;

/**
 * Format a URL as a link.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [FileField](doc:FileField) and
 * [URLField](doc:URLField)
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function LinkFormatter<T extends React.ComponentType | 'a' = 'a'>(
    props: LinkFormatterProps<T>
): React.ReactElement {
    const { value, blankLabel, children, linkComponent: LinkComponent = 'a', ...rest } = props;
    if (value == null || value === '') {
        return <>{blankLabel}</>;
    }
    return (
        <LinkComponent href={value} {...rest}>
            {children || value}
        </LinkComponent>
    );
}
