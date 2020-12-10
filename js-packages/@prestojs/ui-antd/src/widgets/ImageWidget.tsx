import React from 'react';
import FileWidget, { UploadWidgetProps } from './FileWidget';

/**
 * See [FileWidget](doc:FileWidget) for props available
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function ImageWidget(props: UploadWidgetProps<File, HTMLElement>, ref): React.ReactElement {
    return <FileWidget ref={ref} listType="picture-card" accept="image/*" {...props} />;
}

export default React.forwardRef<HTMLElement, UploadWidgetProps<File, HTMLElement>>(ImageWidget);
