import { EditOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { InputProps, WidgetProps } from '@prestojs/ui';
import { isPromise } from '@prestojs/util';
import { Button, Upload } from 'antd';
import { RcFile, UploadFile, UploadProps } from 'antd/lib/upload/interface';
import React, { useEffect, useRef, useState } from 'react';

type UploadWidgetInputType = Omit<
    InputProps<File | string | (File | string)[], HTMLElement>,
    'type'
> & {
    type: 'select' | 'drag' | undefined;
};

/**
 * @expand-properties The props from [Upload](https://ant.design/components/upload/#API). Note that any relating to uploading to server are ignored as this component doesn't upload immediately.
 */
export type UploadWidgetProps<FieldValue, T extends HTMLElement> = Omit<
    WidgetProps<FieldValue, T>,
    'input'
> &
    Omit<
        UploadProps,
        | 'data'
        | 'method'
        | 'customRequest'
        | 'headers'
        | 'onChange'
        | 'withCredentials'
        | 'progress'
    > & {
        input: UploadWidgetInputType;
        /**
         * Number of files to allow. `null` means unlimited. Defaults to `1`.
         */
        limit: number | null;
        /**
         * If true multiple files are accepted otherwise enforces a single value. When true `input.value` must be an
         * array when set.
         *
         * Defaults to `false` if `limit` is `1` otherwise `true`.
         */
        multiple: boolean;
        /**
         * Contents to render (eg. upload button etc). If not provided renders default Icon or Button depending on `listType`
         */
        children: React.ReactNode;
    };

type FileWidgetUploadFile = UploadFile & { key: string | File };

/**
 * Given a Blob return a UploadFile object for use with FileWidget
 * @param uid Unique id for this upload. Used internally by antd Upload
 * @param name Name of the file
 * @param blob The Blob instance (eg. a File)
 */
async function blobToUploadFile(uid: string, name: string, blob: Blob): Promise<UploadFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () =>
            resolve({
                uid,
                name,
                size: blob.size,
                type: blob.type,
                thumbUrl: reader.result as string,
                originFileObj: blob,
            })
        );
        reader.addEventListener('error', error => reject(error));
        try {
            reader.readAsDataURL(blob);
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Given a URL download and read the file and return a UploadFile
 * @param uid Unique id for this upload. Used internally by antd Upload
 * @param url The url to read (eg. a file that was previously uploaded)
 */
function urlToUploadFile(uid: string, url: string): Promise<UploadFile> {
    return fetch(url)
        .then(r => {
            if (r.ok) {
                return r.blob();
            }
            throw r;
        })
        .then(blob => blobToUploadFile(uid, url.split('/').pop() || url, blob));
}

/**
 * Given a value that could either be a URL, a File or an array of either return an array
 * of `UploadFile` to be used with the antd `Upload` component.
 * @param value The value to convert. This would typically come from the form state.
 * @param previewImage If true the `thumbUrl` property will be set for each `UploadFile`
 *
 * @extract-docs
 */
export function useFileList(
    value: File | string | (File | string)[] | null | undefined,
    previewImage: boolean
): UploadFile[] {
    const [fileList, setFileList] = useState<FileWidgetUploadFile[]>([]);
    const filePreviews = useRef<Map<string | File, FileWidgetUploadFile>>(new Map());
    useEffect(() => {
        let isCurrent = true;
        const run = async (): Promise<void> => {
            if (!value) {
                setFileList([]);
                return;
            }
            const values: (File | string)[] = Array.isArray(value) ? value : [value];
            // antd recommends using negative numbers to avoid internal conflicts
            let uid = -1;
            // This will be set immediately so UI reflects immediately showing uploaded
            // files even if we haven't yet generate thumbnail
            const fileList: FileWidgetUploadFile[] = [];
            // This holds promises for files we need to load previews for. This will be
            // set after it resolves.
            const promises: (Promise<UploadFile> | null)[] = [];
            for (const value of values) {
                let uploadFile = filePreviews.current.get(value);
                if (previewImage && uploadFile && uploadFile.thumbUrl) {
                    // Preview was generated preciously with previewImage = false
                    uploadFile = undefined;
                }
                if (!uploadFile) {
                    if (typeof value == 'string') {
                        uploadFile = {
                            key: value,
                            uid: uid.toString(),
                            name: value.split('/').pop() || value,
                            size: 0,
                            type: '',
                        };
                        if (previewImage) {
                            promises.push(urlToUploadFile(uid.toString(), value));
                        }
                    } else {
                        uploadFile = {
                            key: value,
                            uid: uid.toString(),
                            name: value.name,
                            size: value.size,
                            type: value.type,
                            originFileObj: value,
                        };
                        promises.push(blobToUploadFile(uid.toString(), value.name, value));
                    }
                    filePreviews.current.set(value, uploadFile);
                } else if (previewImage) {
                    promises.push(null);
                }
                fileList.push(uploadFile);
                uid -= 1;
            }
            [...filePreviews.current.keys()]
                .filter(f => values.includes(f))
                .forEach(f => filePreviews.current.delete(f));
            // Set file list so renders immediately
            setFileList(fileList);

            // Then if preview images are needed wait for promises to resolve before updating
            // file list again
            if (previewImage && !promises.every(entry => entry === null)) {
                try {
                    const resolved = (await Promise.all(promises)).map((entry, i) =>
                        entry === null ? fileList[i] : { ...entry, key: values[i] }
                    );
                    for (let i = 0; i < resolved.length; i++) {
                        filePreviews.current.set(values[i], resolved[i]);
                    }
                    if (isCurrent) {
                        setFileList(resolved);
                    }
                } catch (e) {
                    console.error('Failed to generate preview for images', e);
                }
            }
        };
        run();
        return (): void => {
            isCurrent = false;
        };
    }, [previewImage, value]);

    return fileList;
}

/**
 * File upload widget that wraps the antd [Upload](https://ant.design/components/upload/#API) component. Unlike
 * that component this one never uploads immediately - the raw `File` object will be passed to `onChange` and it's
 * expected the upload will happen externally (eg. on a form submit).
 *
 * For very custom requirements consider using the [useFileList](doc:useFileList) in a custom component.
 *
 * // TODO: Example: limit
 * // TODO: Example: multiple
 * // TODO: Example: custom children
 * // TODO: Example: drag and drop
 * // TODO: beforeUpload
 *
 * @extract-docs
 * @menu-group Widgets
 * @forward-ref
 */
function FileWidget(
    props: UploadWidgetProps<File, HTMLInputElement>,
    ref: React.RefObject<Upload>
): React.ReactElement {
    let {
        input,
        children,
        beforeUpload,
        listType = 'text',
        limit = 1,
        multiple = limit !== 1,
        ...rest
    } = props;
    const { value, onChange } = input;
    if (Array.isArray(value) && !multiple) {
        throw new Error(`When 'value' is an array 'multiple' must be set to true`);
    }
    if (value && multiple && !Array.isArray(value)) {
        throw new Error(`When 'multiple' is true 'value' must be an array`);
    }
    const beforeUploadFile = (file: File, files: RcFile[]): false | Promise<void> => {
        if (beforeUpload) {
            // beforeUpload can:
            // - return false to stop upload from occurring
            // - return a new Blob to replace uploaded File (eg. to implement Crop)
            // - return undefined to do nothing
            // - Any of the above via a Promise
            const response = beforeUpload(file as RcFile, files);
            if (response === false) {
                return false;
            }
            if (isPromise(response)) {
                return response.then(file => {
                    if (multiple) {
                        // We know value is either not set or an array due to the checks above
                        const currentValue = (value ?? []) as (string | File)[];
                        onChange([...currentValue, file]);
                    } else {
                        onChange(file);
                    }
                });
            }
        }
        if (multiple) {
            // We know value is either not set or an array due to the checks above
            const currentValue = (value ?? []) as (string | File)[];
            onChange([...currentValue, file]);
        } else {
            onChange(file);
        }
        return false;
    };
    const handleRemove = (f: FileWidgetUploadFile): void => {
        if (!multiple) {
            onChange(null);
        } else if (value) {
            onChange((value as (string | File)[]).filter(key => key !== f.key));
        }
    };
    const fileList = useFileList(value, listType.startsWith('picture'));
    const shouldAllowUpload = limit == null || limit > fileList.length || limit === 1;
    if (shouldAllowUpload && !children) {
        const isEdit = limit === 1 && fileList.length === 1;
        if (rest.type === 'drag') {
            children = (
                <>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                </>
            );
        } else {
            children = (
                <>
                    {listType !== 'picture-card' && (
                        <Button>
                            <UploadOutlined /> Click to Upload
                        </Button>
                    )}
                    {listType === 'picture-card' && (isEdit ? <EditOutlined /> : <PlusOutlined />)}
                </>
            );
        }
    }
    return (
        <Upload
            ref={ref}
            listType={listType}
            fileList={fileList}
            beforeUpload={beforeUploadFile}
            customRequest={(): void => {
                // Do nothing
                // We don't upload to the server. Normally this is bypassed in beforeUploadFile by returning false
                // however if you return a Promise then internally antd (or more specifically rc-upload) will
                // always do the request. In that case we can just do nothing here (which is considered a success
                // as nothing is thrown).
            }}
            onRemove={handleRemove}
            {...rest}
        >
            {children}
        </Upload>
    );
}
export default React.forwardRef(FileWidget);
