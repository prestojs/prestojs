import React from 'react';
import EditCopy from '../assets/edit-copy.svg';
import ReactIcon from './ReactIcon';
import SourceLink from './SourceLink';
import Tooltip from './Tooltip';

function CopyToClipboard({ text }) {
    const [copied, setCopied] = React.useState(false);
    React.useEffect(() => {
        let timeout;
        if (copied) {
            timeout = setTimeout(() => {
                setCopied(false);
            }, 5000);
        }
        return () => {
            clearTimeout(timeout);
        };
    }, [copied]);
    return (
        <button
            title="Copy to clipboard"
            className="transition duration-500 ease-in-out hover:text-gray-900 transform hover:scale-110"
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
            }}
        >
            {!copied && <EditCopy className="w-4 fill-current" />}
            {copied && (
                <span className="flex items-center text-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Copied!
                </span>
            )}
        </button>
    );
}

export default function ApiDocHeader({ doc, isComponent, isType = false }) {
    const importString = `import ${isType ? 'type ' : ' '}{ ${doc.name} } from \"@prestojs/${
        doc.packageName
    }\";`;
    return (
        <>
            <header className="flex justify-between items-center">
                <h1 className="text-3xl flex justify-between items-center relative">
                    {doc.name}
                    {isComponent && (
                        <Tooltip content="This is a React component">
                            <ReactIcon className="text-blue-400 ml-5" />
                        </Tooltip>
                    )}
                </h1>
                <SourceLink doc={doc} />
            </header>
            <div className="mb-3 mt-3 bg-orange-100 p-1 rounded pl-2 flex text-gray-800 justify-between">
                <div>{importString}</div>
                <CopyToClipboard text={importString} />
            </div>
        </>
    );
}
