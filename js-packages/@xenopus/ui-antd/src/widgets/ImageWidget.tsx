import React from 'react';
import FileWidget, { FileWidgetInputType } from './FileWidget';

/**
 * See [Upload](https://next.ant.design/components/upload/) for props available
 */
export default function ImageWidget({
    input,
    meta,
}: {
    input: FileWidgetInputType;
    meta: {};
}): React.ReactElement {
    return <FileWidget listType="picture-card" {...{ input, meta }} />;
}
