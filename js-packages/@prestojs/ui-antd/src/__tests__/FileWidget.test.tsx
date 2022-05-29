import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { act, renderHook } from 'presto-testing-library';
import { useFileList } from '../widgets/FileWidget';

type Props = { value?: string | File | null | (string | File)[]; preview: boolean };

const fetchMock = fetch as FetchMock;

test('useFileList should convert File objects to antd representation', async () => {
    const { result, rerender } = renderHook(
        ({ value, preview }: Props) => useFileList(value, { previewImage: preview }),
        { initialProps: { value: null, preview: false } }
    );
    expect(result.current.fileList).toEqual([]);
    const file1 = new File([], 'test.png', { type: 'image/png' });
    rerender({ value: file1, preview: false });
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            uid: '-1',
            name: 'test.png',
            size: 0,
            percent: 0,
            type: 'image/png',
            originFileObj: file1,
        }),
    ]);
    rerender({ value: file1, preview: true });
    // TODO: Something wrong here in strict mode - thumbUrl not there
    await waitFor(() =>
        expect(result.current.fileList).toEqual([
            expect.objectContaining({
                uid: '-1',
                name: 'test.png',
                size: 0,
                percent: 0,
                thumbUrl: expect.stringContaining('data:image/png;base64'),
                type: 'image/png',
                originFileObj: file1,
            }),
        ])
    );

    const file2 = new File([], 'test2.png', { type: 'image/png' });
    rerender({ value: [file1, file2], preview: true });

    await waitFor(() =>
        expect(result.current.fileList).toEqual([
            expect.objectContaining({
                uid: '-1',
                name: 'test.png',
                size: 0,
                percent: 0,
                thumbUrl: expect.stringContaining('data:image/png;base64'),
                type: 'image/png',
                originFileObj: file1,
            }),
            expect.objectContaining({
                uid: '-2',
                name: 'test2.png',
                size: 0,
                percent: 0,
                thumbUrl: expect.stringContaining('data:image/png;base64'),
                type: 'image/png',
                originFileObj: file2,
            }),
        ])
    );
    rerender({ value: [file1], preview: true });
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            uid: '-1',
            name: 'test.png',
            size: 0,
            percent: 0,
            thumbUrl: expect.stringContaining('data:image/png;base64'),
            type: 'image/png',
            originFileObj: file1,
        }),
    ]);
    rerender({ value: [], preview: true });
    expect(result.current.fileList).toEqual([]);
    rerender({ value: undefined, preview: true });
    expect(result.current.fileList).toEqual([]);
});

test('useFileList should convert string urls to antd representation', async () => {
    const { result, rerender } = renderHook(
        ({ value, preview }: Props) => useFileList(value, { previewImage: preview }),
        { initialProps: { value: null, preview: false } }
    );
    expect(result.current.fileList).toEqual([]);
    const file1 = 'test1.png';
    rerender({ value: file1, preview: false });
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            // Also contains lastModified, lastModifiedDate
            uid: 'test1.png',
            originFileObj: expect.objectContaining({
                uid: 'test1.png',
            }),
            name: 'test1.png',
            percent: 0,
            size: 0,
            type: '',
        }),
    ]);
    const contentType = 'image/png';
    fetchMock.mockResponseOnce('abc', {
        headers: {
            'Content-Type': contentType,
        },
    });
    // Causes: TypeError: Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'.
    // Don't know why... seems to be something in either jsdom or jest-fetch-mock
    // rerender({ value: file1, preview: true });
    // await waitForNextUpdate();
    // expect(result.current).toEqual([
    //     {
    //         key: file1,
    //         uid: '-1',
    //         name: 'test.png',
    //         size: 0,
    //         thumbUrl: expect.stringContaining('data:image/png;base64'),
    //         type: 'image/png',
    //         originFileObj: file1,
    //     },
    // ]);
});

test('useFileList should handle file status updates', async () => {
    const file1 = new File([], 'test.png', { type: 'image/png' });
    const { result, rerender } = renderHook(
        ({ value, preview }: Props) => useFileList(value, { previewImage: preview }),
        { initialProps: { value: file1, preview: false } }
    );
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            uid: '-1',
            name: 'test.png',
            size: 0,
            percent: 0,
            type: 'image/png',
            originFileObj: file1,
        }),
    ]);
    act(() => result.current.updateFileStatus(result.current.fileList[0].uid, 'uploading', 10));
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            uid: '-1',
            name: 'test.png',
            size: 0,
            type: 'image/png',
            originFileObj: file1,
            percent: 10,
            status: 'uploading',
        }),
    ]);
    act(() => result.current.updateFileStatus(result.current.fileList[0].uid, 'done', 100));
    expect(result.current.fileList).toEqual([
        expect.objectContaining({
            uid: '-1',
            name: 'test.png',
            size: 0,
            type: 'image/png',
            originFileObj: file1,
            percent: 100,
            status: 'done',
        }),
    ]);
});
