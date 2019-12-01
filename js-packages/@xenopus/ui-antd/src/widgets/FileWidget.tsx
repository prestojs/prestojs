import { InputProps } from '@xenopus/ui/FieldWidget';
import { Upload } from 'antd';
import React from 'react';

export type FileWidgetInputType = Omit<InputProps<File, HTMLElement>, 'type'> & {
    type: 'select' | 'drag' | undefined;
} & { beforeUpload?(file: File): void };

/**
 * See [Upload](https://next.ant.design/components/upload/) for props available
 */
// Fixme: need test to see whether this works. djRad1 also included fileList manipulation and adjustments for specific backend. mirror?
export default function FileWidget({
    input,
    listType,
}: {
    input: FileWidgetInputType;
    meta: {};
    listType: 'picture-card' | 'picture' | 'text' | undefined;
}): React.ReactElement {
    const { beforeUpload, ...rest } = input;

    const beforeUploadFile = (file: File): boolean => {
        if (beforeUpload) {
            beforeUpload(file);
        }
        input.onChange(file);
        return false;
    };

    return <Upload listType={listType} beforeUpload={beforeUploadFile} {...rest} />;
}
