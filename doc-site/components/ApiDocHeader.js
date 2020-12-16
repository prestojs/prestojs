import React from 'react';
import EditCopy from '../assets/edit-copy.svg';
import SourceLink from './SourceLink';

function CopyToClipboard({ text }) {
    return (
        <button
            title="Copy to clipboard"
            className="transition duration-500 ease-in-out hover:text-gray-900 transform hover:scale-110"
            onClick={() => {
                navigator.clipboard.writeText(text);
            }}
        >
            <EditCopy className="w-4 fill-current" />
        </button>
    );
}

export default function ApiDocHeader({ doc, isType = false }) {
    const importString = `import ${isType ? 'type ' : ' '}{ ${doc.name} } from \"@prestojs/${
        doc.packageName
    }\";`;
    return (
        <>
            <header className="flex justify-between items-center">
                <h1 className="text-3xl flex justify-between items-center">{doc.name}</h1>
                <SourceLink doc={doc} />
            </header>
            <div className="mb-3 mt-3 bg-orange-100 p-1 rounded pl-2 flex text-gray-800 justify-between">
                <div>{importString}</div>
                <CopyToClipboard text={importString} />
            </div>
        </>
    );
}
