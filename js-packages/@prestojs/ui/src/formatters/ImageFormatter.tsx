import React, { ReactNode, useMemo } from 'react';

/**
 * @expandproperties Any additional props are passed through to the `img` tag
 */
export type ImageFormatterProps = {
    /**
     * The value to render. Should be a valid URL or a File/Blob.
     */
    value?: null | string | Blob;
    /**
     * What to render when `value` is `null`, `undefined` or an empty string
     *
     * Defaults to `null`
     */
    blankLabel?: ReactNode;
} & JSX.IntrinsicElements['img'];

/**
 * Render an image from a URL
 *
 * This is the [default formatter](doc:getFormatterForField) used for [ImageField](doc:ImageField)
 *
 * <Usage>
 *    Basic usage just requires passing the image URL through:
 *
 *    ```js
 *    <ImageFormatter value="https://picsum.photos/200/300" />
 *    ```
 *    If no value is passed then, by default, nothing will be rendered. You can pass `blankLabel` to render a default
 *    when no value is present:
 *
 *    ```js
 *    <ImageFormatter blankLabel={<em>Not set</em>} />
 *    ```
 *
 * </Usage>
 *
 * @extractdocs
 * @menugroup Formatters
 */
export default function ImageFormatter(props: ImageFormatterProps): React.ReactElement | null {
    const { value, blankLabel, ...rest } = props;
    const blobUrl = useMemo(() => {
        if (typeof Blob !== 'undefined' && value instanceof Blob) {
            return URL.createObjectURL(value);
        }
    }, [value]);
    if (!value) {
        return <>{blankLabel}</>;
    }
    // Check `Blob` exists so works with SSR (eg. nextjs)
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return <img src={blobUrl} {...rest} />;
    }

    return <img src={value as string} {...rest} />;
}
