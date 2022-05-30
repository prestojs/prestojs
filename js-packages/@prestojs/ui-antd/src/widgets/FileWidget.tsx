import { EditOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { InputProps, WidgetProps } from '@prestojs/ui';
import { isPromise } from '@prestojs/util';
import { Button, Upload } from 'antd';
import type { RcFile, UploadFile, UploadFileStatus, UploadProps } from 'antd/es/upload/interface';
import { file2Obj } from 'antd/lib/upload/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type UploadWidgetInputType = Omit<
    InputProps<File | string | (File | string)[], HTMLElement>,
    'type'
> & {
    type: 'select' | 'drag' | undefined;
};

/**
 * @expand-properties The props from [Upload](https://ant.design/components/upload/#API). Note that `data`, `method`, `headers` and `withCredentials` are ignored as this component doesn't upload immediately.
 */
export type UploadWidgetProps<FieldValue, T extends HTMLElement> = Omit<
    WidgetProps<FieldValue, T>,
    'input'
> &
    Omit<UploadProps, 'data' | 'method' | 'headers' | 'onChange' | 'withCredentials'> & {
        input: UploadWidgetInputType;
        /**
         * Number of files to allow. `null` means unlimited.
         *
         * If `limit` is `1` then after uploading a file the UI will change from an Add icon to an Edit icon and
         * uploading a new file will replace the original.
         *
         * If `limit` is > `1` then once the limit has been reached the UI will disallow adding new files. To add a
         * new file an existing one must be removed.
         *
         * If `multiple` is `true` then the value passed to `onChange` will be an array, otherwise
         * it will be a `File` object or null. It is valid to set `limit` to `1` and `multiple` to `true`.
         *
         * Defaults to `1`.
         */
        limit: number | null;
        /**
         * Whether multiple values are accepted. In most cases you can set `limit` to `null` or a value greater than
         * `1` instead of explicitly setting this. This can be set to `true` when `limit` is `1` in order to enforce
         * the value being an array (eg. this could be useful if `limit` increases based on something else).
         *
         * If true `input.value` must be an array when set and `onChange` will be passed an array of
         * [File](https://developer.mozilla.org/en-US/docs/Web/API/File) objects, otherwise it will be passed a single
         * value or null.
         *
         * If `multiple` is `true` and `limit` is 1 then the only difference to `multiple={false}` is that the `value`
         * will be an array.
         *
         * Defaults to `false` if `limit` is `1` otherwise `true`.
         */
        multiple: boolean;
        /**
         * Contents to render (eg. upload button etc). If not provided renders default Icon or Button depending on `listType`
         */
        children: React.ReactNode;
    };

type FileLike = Blob | File | RcFile | string;

/**
 * Given a Blob return a UploadFile object for use with FileWidget
 * @param uid Unique id for this upload. Used internally by antd Upload
 * @param name Name of the file
 * @param blob The Blob instance (eg. a File)
 */
export async function blobToUploadFile(uid: string, name: string, blob: Blob): Promise<UploadFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const rcFile = Object.assign(blob as RcFile, {
                uid,
            });
            const uploadFile = file2Obj(rcFile);
            uploadFile.thumbUrl = reader.result as string;
            uploadFile.name = name;
            resolve(uploadFile);
        });
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
export function urlToUploadFile(uid: string, url: string): Promise<UploadFile> {
    return fetch(url)
        .then(r => {
            if (r.ok) {
                return r.blob();
            }
            throw r;
        })
        .then(blob => blobToUploadFile(uid, url.split('/').pop() || url, blob));
}

type UseFileListReturn = {
    /**
     * List of objects that can be passed to the `fileList` prop on [Upload](https://ant.design/components/upload)
     */
    fileList: UploadFile[];
    /**
     * Should be called from the `onChange` prop on [Upload](https://ant.design/components/upload) and passed the
     * changed file. This is used to update the progress on overall status of the file. Only applicable when an
     * upload is occurring immediately (eg. when you pass `customRequest`) instead of as part of the final form submission.
     */
    updateFileStatus: (uid: string, status?: UploadFileStatus, percent?: number) => void;
};

/**
 * @expand-properties
 */
type UseFileListOptions = {
    /**
     * If true the `thumbUrl` property will be set for each `UploadFile`
     */
    previewImage?: boolean;
    /**
     * When `previewImage` is true this function will be called to generate a URL to use
     * as the thumbnail for an image. It can either return a Promise that resolves to
     * a string/false or return string/false directly
     *
     * If not specified or `getThumbUrl` returns `false` then the underlying File will be
     * read and a thumbnail generated automatically.
     *
     * @param FileLike
     */
    getThumbUrl?: (FileLike) => Promise<string | false> | string | false;
};

/**
 * Given a value that could either be a URL, a File or an array of either return an array
 * of `UploadFile` to be used with the antd `Upload` component. A function `updateFileStatus`
 * is returned to allow updating the progress and final status of a file.
 *
 * @param value The value to convert. This would typically come from the form state.
 * @param options
 *
 * @extract-docs
 * @menu-group Widget Hooks
 */
export function useFileList(
    value: FileLike | FileLike[] | null | undefined,
    options: UseFileListOptions
): UseFileListReturn {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const { getThumbUrl, previewImage } = options;
    useEffect(() => {
        const run = async (): Promise<void> => {
            setFileList(currentFileList => {
                if (!value) {
                    return [];
                }
                const values: FileLike[] = Array.isArray(value) ? value : [value];
                // antd recommends using negative numbers to avoid internal conflicts
                let uid = -1;
                // This will be set immediately so UI reflects immediately showing uploaded
                // files even if we haven't yet generate thumbnail
                const nextFileList: UploadFile[] = [];
                // This holds promises for files we need to load previews for. This will be
                // set after it resolves.
                const promises: (Promise<UploadFile> | null)[] = [];

                async function generatePreview(
                    value: FileLike,
                    uploadFile: UploadFile
                ): Promise<UploadFile> {
                    const thumbUrl = getThumbUrl ? await getThumbUrl(value) : false;
                    if (thumbUrl === false) {
                        if (typeof value === 'string') {
                            return urlToUploadFile(uploadFile.uid, value);
                        } else {
                            return blobToUploadFile(
                                uploadFile.uid.toString(),
                                uploadFile.name,
                                value
                            );
                        }
                    }
                    return { ...uploadFile, thumbUrl };
                }

                for (const value of values) {
                    let uploadFile = currentFileList.find(el => el.originFileObj === value);
                    if (previewImage && uploadFile && !uploadFile.thumbUrl) {
                        // Preview was generated preciously with previewImage = false
                        uploadFile = undefined;
                    }
                    if (!uploadFile) {
                        if (typeof value == 'string') {
                            const uid = value;
                            const name = value.split('/').pop() || value;
                            const fakeFile = Object.assign(new File([], name), {
                                uid: uid,
                            }) as RcFile;
                            uploadFile = file2Obj(fakeFile);
                            if (previewImage) {
                                promises.push(generatePreview(value, uploadFile));
                            }
                        } else {
                            // antd seems to attach a uid to the file which we need to use if available
                            // without this the onChange event seems to end up with multiple entries - one
                            // with the uid from antd and one that is assigned here
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            const valueUid = value.uid || uid.toString();
                            // If a Blob is passed it won't necessarily have a `name` (in some cases it appears antd
                            // libraries attach this, eg. antd-img-crop). Log a warning if name isn't available but
                            // set it to `uid` so things continue to work (preview may not work properly).
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            uploadFile = file2Obj(
                                Object.assign(value as RcFile, { uid: valueUid })
                            );
                            if (!(value as RcFile).name) {
                                console.warn(
                                    'No name set for uploaded file. Consider adding a `name` property if passing a `Blob`.'
                                );
                                uploadFile.name = `${valueUid}`;
                            }
                            if (previewImage) {
                                promises.push(generatePreview(value, uploadFile));
                            }
                        }
                    } else if (previewImage) {
                        promises.push(null);
                    }
                    nextFileList.push(uploadFile);
                    uid -= 1;
                }
                const handlePreviews = async (): Promise<void> => {
                    // Then if preview images are needed wait for promises to resolve before updating
                    // file list again
                    if (previewImage && !promises.every(entry => entry === null)) {
                        try {
                            const resolved = (await Promise.all(promises)).map((entry, i) =>
                                entry === null ? nextFileList[i] : entry
                            );
                            setFileList(currentFileList => {
                                const nextFileList = [...currentFileList];
                                for (const resolvedFile of resolved) {
                                    const index = nextFileList.findIndex(
                                        f => f.uid === resolvedFile.uid
                                    );
                                    if (index !== -1) {
                                        nextFileList[index] = resolvedFile;
                                    }
                                }
                                return nextFileList;
                            });
                        } catch (e) {
                            console.error('Failed to generate preview for images', e);
                        }
                    }
                };
                // Call this to wait for Promises and then return immediately so state transition occurs
                handlePreviews();
                return nextFileList;
            });
        };
        run();
    }, [getThumbUrl, previewImage, value]);

    const updateFileStatus = useCallback((uid, status, percent): void => {
        setFileList(fileList => {
            const index = fileList.findIndex(f => f.uid === uid);
            if (index !== -1) {
                const entry = fileList[index];
                const nextFileList = [...fileList];
                nextFileList[index] = {
                    ...entry,
                    percent: percent,
                    status: status,
                };
                return nextFileList;
            }
            return fileList;
        });
    }, []);
    return { fileList, updateFileStatus };
}

/**
 * File upload widget that wraps the antd [Upload](https://ant.design/components/upload/#API) component. Unlike
 * that component this one never uploads immediately - the raw [File](https://developer.mozilla.org/en-US/docs/Web/API/File)
 * object will be passed to `onChange` and it's expected the upload will happen externally (eg. on a form submit).
 *
 * If `multiple` is true then the value passed to `onChange` will be an array of `File` objects or an empty array when clearing the value.
 *
 * If `multiple` is false then the value passed to `onChange` will be a `File` object or `null` when clearing the value.
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
function FileWidget(props: UploadWidgetProps<File, HTMLInputElement>, ref): React.ReactElement {
    let {
        input,
        children,
        beforeUpload,
        listType = 'text',
        limit = 1,
        multiple = limit !== 1,
        meta,
        ...rest
    } = props;
    const { value, onChange } = input;
    // Track value in ref so can access it in beforeUpload. See notes there.
    const lastValue = useRef(value);
    lastValue.current = value;
    if (Array.isArray(value) && !multiple) {
        throw new Error(`When 'value' is an array 'multiple' must be set to true`);
    }
    if (value && multiple && !Array.isArray(value)) {
        throw new Error(`When 'multiple' is true 'value' must be an array`);
    }
    if (limit && limit > 1 && !multiple) {
        throw new Error(`When 'limit' is greater than 1 'multiple' must be true`);
    }
    const beforeUploadFile = (file: File, files: RcFile[]): false | Promise<void> => {
        if (beforeUpload) {
            // beforeUpload can:
            // - return false to stop upload from occurring
            // - return a new Blob to replace uploaded File (eg. to implement Crop)
            // - return undefined to do nothing
            // - return a promise that returns undefined. in this case customRequest will be called.
            const response = beforeUpload(file as RcFile, files);
            if (response === false) {
                return false;
            }
            if (isPromise(response)) {
                return response.then(f => {
                    if (multiple) {
                        // We know value is either not set or an array due to the checks above
                        // value could be an empty string, not just undefined or null
                        // Read from ref instead of currentValue; if multiple files are uploaded at once (eg.
                        // drag and drop multiple files to uploader) then beforeUploadFile is called for each
                        // one but they each file after the first will have a stale reference to the original `value`.
                        const currentValue = (lastValue.current || []) as (string | File)[];
                        onChange([...currentValue, f]);
                    } else {
                        onChange(f);
                    }
                });
            }
        }
        if (multiple) {
            // We know value is either not set or an array due to the checks above
            const currentValue = (lastValue.current ?? []) as (string | File)[];
            const nextValue = [...currentValue, file];
            // We update this immediately otherwise uploading multiple files in one go (eg. selecting multiple
            // in the file select box) will only capture the last file. Each file is passed to beforeUpload in
            // order but all of them have captured `value` at the same point. The state transition from `onChange`
            // hasn't propagated by the time the next function is called and so lastValue.current hasn't updated.
            lastValue.current = nextValue;
            onChange(nextValue);
        } else {
            onChange(file);
        }
        return false;
    };
    const handleRemove = (f: UploadFile): void => {
        if (multiple) {
            onChange(
                (lastValue.current as (string | RcFile)[]).filter(
                    val => (typeof val === 'string' ? val : val.uid) !== f.uid
                )
            );
        } else {
            onChange(null);
        }
    };
    const { fileList, updateFileStatus } = useFileList(value, {
        previewImage: listType.startsWith('picture'),
    });
    const shouldAllowUpload =
        limit == null || limit > fileList.length || (!multiple && limit === 1);
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
                // Note: This can be overridden by passing `customRequest` if the upload needs to happen immediately.
            }}
            onRemove={handleRemove}
            multiple={multiple}
            {...rest}
            onChange={(info): void => {
                updateFileStatus(info.file.uid, info.file.status, info.file.percent);
            }}
        >
            {children}
        </Upload>
    );
}
export default React.forwardRef(FileWidget);
