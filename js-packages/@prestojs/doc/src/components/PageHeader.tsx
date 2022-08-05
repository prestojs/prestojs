import React, { useEffect, useState } from 'react';
import { Page, PageMetaData } from '../newTypes';
import SourceLink from './SourceLink';
import Tooltip from './Tooltip';
import TypeParameters from './TypeParameters';

function CopyToClipboard({ text }) {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        let isCurrent = true;
        if (copied) {
            setTimeout(() => {
                if (isCurrent) {
                    setCopied(false);
                }
            }, 4000);
        }
        return () => {
            isCurrent = false;
        };
    }, [copied]);
    return (
        <button
            title="Copy to clipboard"
            className={`transition duration-100 ease-in-out transform hover:scale-110 ${
                copied ? 'text-green-500' : 'text-gray-500 hover:text-gray-600 '
            }`}
            onClick={() => {
                setCopied(true);
                navigator.clipboard.writeText(text);
            }}
        >
            <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'} position="left">
                {copied ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                    </svg>
                )}
            </Tooltip>
        </button>
    );
}

export default function PageHeader({ page, meta }: { page: Page; meta: PageMetaData }) {
    const importString = `import ${page.isTypeOnly ? 'type' : ''} { ${
        page.name
    } } from \"@prestojs/${meta.packageName}\";`;
    return (
        <>
            <header className="flex justify-between items-center">
                <h1 className="text-3xl flex justify-between items-center relative" id={page.name}>
                    {page.name}
                    {page.isTypeOnly && (
                        <Tooltip
                            className="p-0.5 bg-sky-50 border border-sky-500 text-sm ml-5"
                            content={
                                <span>
                                    This is a type. If you aren't using typescript you don't need to
                                    import this directly.
                                </span>
                            }
                        >
                            Typescript Type
                        </Tooltip>
                    )}
                </h1>
                <SourceLink sourceLocation={page.sourceLocation} />
            </header>
            <div className="mb-3 mt-3 bg-orange-50 p-1 rounded pl-2 flex text-gray-800 justify-between">
                <div>{importString}</div>
                <CopyToClipboard text={importString} />
            </div>
            {page.typeParameters && (
                <div className="mb-3 mt-3 p-1 rounded pl-2 bg-sky-50 flex justify-between">
                    <div>
                        {page.name}
                        <TypeParameters typeParameters={page.typeParameters} />
                    </div>
                    <Tooltip
                        content={
                            <span>This shows you the type parameters for this class/function</span>
                        }
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-sky-700"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </Tooltip>
                </div>
            )}
        </>
    );
}
