import { InputProps, WidgetProps } from '@xenopus/ui';
import { Upload } from 'antd';
import React from 'react';

type UploadWidgetInputType = Omit<InputProps<File, HTMLElement>, 'type'> & {
    type: 'select' | 'drag' | undefined;
} & {
    beforeUpload?(file: File): void;
    listType: 'picture-card' | 'picture' | 'text' | undefined;
};

export interface UploadWidgetProps<FieldValue, T extends HTMLElement>
    extends Omit<WidgetProps<FieldValue, T>, 'input'> {
    input: UploadWidgetInputType;
}

/**
 * See [Upload](https://next.ant.design/components/upload/) for props available
 */
// Fixme: need test to see whether this works. djRad1 also included fileList manipulation and adjustments for specific backend. mirror?
export default function FileWidget({
    input,
}: UploadWidgetProps<File, HTMLElement>): React.ReactElement {
    const { beforeUpload, listType = 'text', ...rest } = input;

    const beforeUploadFile = (file: File): boolean => {
        if (beforeUpload) {
            beforeUpload(file);
        }
        input.onChange(file);
        return false;
    };

    return <Upload listType={listType} beforeUpload={beforeUploadFile} {...rest} />;
}
