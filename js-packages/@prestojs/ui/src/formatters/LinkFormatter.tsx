import React, { ReactNode } from 'react';

/**
 * @expand-properties Any extra props are passed directly through to `linkComponent`
 * @typeParam LinkComponentT @inherit
 */
type LinkFormatterProps<LinkComponentT extends React.ComponentType | 'a' = 'a'> = {
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * The link component to use. Defaults to `a`.
     */
    linkComponent?: LinkComponentT;
    /**
     * The URL to link to
     */
    value?: null | string;
    /**
     * The children to pass through to the `linkComponent`.
     */
    children?: React.ReactNode;
} & Omit<
    LinkComponentT extends 'a' ? JSX.IntrinsicElements['a'] : React.ComponentProps<LinkComponentT>,
    'href'
>;

/**
 * Format a URL as a link.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [FileField](doc:FileField) and
 * [URLField](doc:URLField)
 *
 * <Usage>
 *     Basic usage requires URL to be passed through in the `value` prop
 *
 *     ```js
 *     <LinkFormatter value="https://prestojs.com" />
 *     ```
 *
 *     This renders using an `a` component by default but can be changed with the `linkComponent` prop:
 *
 *     ```js
 *     <LinkFormatter value="/about-us/" linkComponent={Link} />
 *     ```
 *
 *     The passed `linkComponent` must accept a `href` prop.
 *
 *     If no value is passed then, by default, nothing will be rendered. You can pass `blankLabel` to render a default
 *     when no value is present:
 *
 *     ```js
 *     <LinkFormatter value={null} blankLabel={<em>No URL set</em>} />
 *     ```
 * </Usage>
 *
 * @extract-docs
 * @menu-group Formatters
 * @typeParam LinkComponentT The type of React component used. Defaults to `a`.
 */
export default function LinkFormatter<LinkComponentT extends React.ComponentType | 'a' = 'a'>(
    props: LinkFormatterProps<LinkComponentT>
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
