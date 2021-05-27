import { ImageFormatter } from '@prestojs/ui';
import { useAsync } from '@prestojs/util';
import React, { useState } from 'react';

let img;
if (typeof Image !== 'undefined') {
    img = new Image(200, 200);
    img.src = 'https://picsum.photos/200';
}

async function getBlob() {
    return (await fetch('https://picsum.photos/100')).blob();
}
export default function Basic() {
    const [fileList, setFileList] = useState<FileList | null>(null);
    const { response: blob } = useAsync(getBlob, { trigger: 'SHALLOW' });

    return (
        <div className="grid grid-cols-1 gap-4 w-full mt-5">
            <ImageFormatter value="https://picsum.photos/200/300" />
            <hr />
            <strong>
                Load from an <code>File</code> instance directly
            </strong>
            <input type="file" onChange={({ target: { files } }) => setFileList(files)} />
            {fileList && [...fileList].map(file => <ImageFormatter value={file} />)}
            <hr />
            <strong>
                Load from an <code>Blob</code> instance directly
            </strong>
            {blob && <ImageFormatter value={blob} />}
            <hr />
            <strong>
                Specify <code>blankLabel</code> to control rendering when no value provided
            </strong>
            <ImageFormatter value={null} blankLabel={<em>None</em>} />
        </div>
    );
}
