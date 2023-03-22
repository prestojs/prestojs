import React, { ReactElement, ReactNode } from 'react';

/**
 * @expand-properties
 */
type CharFormatterProps = {
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
    /**
     * The value to render
     */
    value?: string | null;
};

/**
 * Format a string for display. Returns value directly as is.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [CharField](doc:CharField), [EmailField](doc:EmailField),
 * [TextField](doc:TextField), and [JsonField](doc:JsonField)
 *
 * <Usage>
 *     Basic usage requires the string to be passed through in the `value` prop
 *
 *     ```js
 *     <CharFormatter value="Cheese" />
 *     ```
 *
 *     If no value is passed then, by default, nothing will be rendered. You can pass `blankLabel` to render a default
 *     when no value is present:
 *
 *     ```js
 *     <CharFormatter value={null} blankLabel={<em>Not set</em>} />
 *     ```
 *
 * </Usage>
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function CharFormatter(props: CharFormatterProps): ReactElement {
    const { value, blankLabel = null } = props;
    if (value == null || value === '') {
        return <>{blankLabel}</>;
    }
    return <>{value || ''}</>;
}
