import { InputProps, WidgetProps } from '@prestojs/ui/FieldWidgetInterface';
import { Upload, Button } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import { UploadFile } from 'antd/lib/upload/interface';
//import { UploadProps } from 'antd/lib/upload/interface'; // we're not using uploadprops as it's using rcFile not File - not worth the hassle

type UploadWidgetInputType = Omit<InputProps<File, HTMLElement>, 'type'> & {
    type: 'select' | 'drag' | undefined;
};

export interface UploadWidgetProps<FieldValue, T extends HTMLElement>
    extends Omit<WidgetProps<FieldValue, T>, 'input'> {
    input: UploadWidgetInputType;
    beforeUpload?(file: File, fileList: Array<object>): void;
    listType: 'picture-card' | 'picture' | 'text' | undefined;
}

/**
 * See [Upload](https://next.ant.design/components/upload/) for props available
 */
// TODO: test needed to see whether multiple upload support works. djrad1 upload's strictly single file only.
const FileWidget = React.forwardRef(
    (
        {
            input,
            beforeUpload,
            listType = 'text',
            ...rest
        }: UploadWidgetProps<File, HTMLInputElement>,
        ref: React.RefObject<Upload>
    ): React.ReactElement => {
        const [fileList, setFileList] = useState([] as Array<UploadFile>);

        const beforeUploadFile = (file: any): boolean => {
            if (beforeUpload) {
                beforeUpload(file, fileList);
            }
            input.onChange(file);
            const newFiles = fileList;
            newFiles.push(file);
            setFileList(newFiles);
            return false;
        };

        const handleRemove = (file: any): void => {
            input.onChange(null);
            setFileList(fileList.filter(v => v != file));
        };

        useEffect(() => {
            const { value } = input;
            if (value) {
                if (typeof value == 'string') {
                    const parts = (value as string).split('/');
                    fileList.push({
                        uid: '-1',
                        name: parts.length > 0 ? parts[parts.length - 1] : value,
                        status: 'done',
                        url: value,
                        thumbUrl: value,
                        size: -1,
                        type: 'select',
                    });
                } else if (Array.isArray(value)) {
                    value.map(entry => {
                        const parts = (entry as string).split('/');
                        return fileList.push({
                            uid: '-1',
                            name: parts.length > 0 ? parts[parts.length - 1] : entry,
                            status: 'done',
                            url: entry,
                            thumbUrl: entry,
                            size: -1,
                            type: 'select',
                        });
                    });
                } else {
                    fileList.push(value as any);
                }
            }
        }, [fileList, input]);

        return (
            <Upload
                ref={ref}
                listType={listType}
                beforeUpload={beforeUploadFile}
                onRemove={handleRemove}
                fileList={fileList}
                {...input}
                {...rest}
            >
                {listType !== 'picture-card' && (
                    <Button>
                        <UploadOutlined /> Click to Upload
                    </Button>
                )}
                {listType === 'picture-card' && <PlusOutlined />}
            </Upload>
        );
    }
);

export default FileWidget;
