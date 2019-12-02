import { Upload } from 'antd';
import React from 'react';
import { UploadWidgetProps } from './FileWidget';

/**
 * See [Upload](https://next.ant.design/components/upload/) for props available
 */
// FIXME: need test to see whether this works. djRad1 also included fileList manipulation and adjustments for specific backend. mirror?
// might need additional features eg rescale/EXIF correction
export default function FileWidget({
    input,
}: UploadWidgetProps<File, HTMLElement>): React.ReactElement {
    const { beforeUpload, listType = 'picture-card', ...rest } = input;

    const beforeUploadFile = (file: File): boolean => {
        if (beforeUpload) {
            beforeUpload(file);
        }
        input.onChange(file);
        return false;
    };

    return <Upload listType={listType} beforeUpload={beforeUploadFile} {...rest} />;
}
