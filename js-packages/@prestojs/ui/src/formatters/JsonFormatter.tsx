import React, { ComponentProps, ReactElement } from 'react';

/**
 * @expand-properties
 */
type JsonFormatterProps = {
    /**
     * The `space` option passed to [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#space)
     *
     * Defaults to `2`
     */
    space?: string | number;
    /**
     * The value to render
     */
    value?: string | null;
} & Omit<ComponentProps<'pre'>, 'children'>;

/**
 * Format a JS value for display as a JSON string.
 *
 * This is the [default formatter](doc:getFormatterForField) used for [JsonField](doc:JsonField), [EmailField](doc:EmailField),
 * [TextField](doc:TextField), and [JsonField](doc:JsonField)
 *
 * <Usage>
 *     Basic usage requires the JS value to be passed through in the `value` prop, which will then be passed through `JSON.stringify`.
 *
 *     ```js
 *     <JsonFormatter value={{ name: 'Gandalf' }} />
 *     ```
 *
 *     You can pass `space` to control the spacing used in `JSON.stringify` (defaults to `2`).
 *
 *     The output is wrapped in a `pre` tag. Any additional props will be passed directly through to this tag.
 * </Usage>
 *
 * @extract-docs
 * @menu-group Formatters
 */
export default function JsonFormatter(props: JsonFormatterProps): ReactElement {
    const { value, space = 2, ...rest } = props;
    return <pre {...rest}>{JSON.stringify(value, null, space)}</pre>;
}
