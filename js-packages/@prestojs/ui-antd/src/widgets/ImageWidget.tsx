import React from 'react';
import type { UploadWidgetProps } from './FileWidget';
import FileWidget from './FileWidget';

function ImageWidget(
    props: Omit<UploadWidgetProps<File, HTMLElement>, 'ref'>,
    ref
): React.ReactElement {
    return <FileWidget ref={ref} listType="picture-card" accept="image/*" {...props} />;
}

/**
 * See [FileWidget](doc:FileWidget) for props available
 *
 * @extractdocs
 * @menugroup Widgets
 * @forwardref
 */
export default React.forwardRef(ImageWidget) as (
    props: UploadWidgetProps<File, HTMLElement>
) => React.ReactElement;
