import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import SearchIcon from '../assets/search.svg';

function SearchBar() {
    const inputRef = useRef<null | HTMLInputElement>(null);
    const router = useRouter();
    const [searchEnabled, setSearchEnabled] = useState(false);
    useEffect(() => {
        const cb = e => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                return;
            }
            if (e.code === 'Slash' && inputRef.current) {
                inputRef.current.focus();
                e.preventDefault();
            }
        };
        document.body.addEventListener('keydown', cb);
        // @ts-ignore
        window.docsearch({
            apiKey: 'a174d5aef3f073d6502856e595a673ba',
            indexName: 'prestojs',
            inputSelector: '#search-input',
            debug: false, // Set debug to true if you want to inspect the dropdown
            handleSelected: function (input, event, suggestion, datasetNumber, context) {
                const { url } = suggestion;
                const a = document.createElement('a');
                a.href = url;
                const localUrl = url.replace(a.origin, '');
                router.push(localUrl);
                // NOTE: This means cmd-click etc don't work. This is actually docsearch
                // doing it - if you provide a handleSelected it prevents default - would be
                // better if it left that to you.
            },
        });
        setSearchEnabled(true);
        return () => document.body.removeEventListener('keydown', cb);
    }, []);
    return (
        <>
            <Head>
                <script
                    type="text/javascript"
                    src="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.js"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css"
                />
            </Head>
            <div className="w-full lg:px-6 xl:w-3/4 xl:px-12">
                <div className="relative">
                    <input
                        disabled={!searchEnabled}
                        ref={inputRef}
                        className="transition-colors duration-100 ease-in-out focus:outline-0 border border-transparent focus:bg-white focus:border-gray-300 placeholder-gray-600 rounded-lg bg-gray-200 py-2 pr-4 pl-10 block w-full appearance-none leading-normal ds-input"
                        id="search-input"
                        type="text"
                        placeholder="Search"
                        autoComplete="off"
                        spellCheck="false"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded="false"
                        aria-label="search input"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                        <SearchIcon className="fill-current pointer-events-none text-gray-600 w-4 h-4" />
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Header() {
    return (
        <div className="flex bg-gray-800 fixed top-0 inset-x-0 z-30 h-16 items-center">
            <div className="w-full max-w-screen-xl relative mx-auto px-6">
                <div className="flex items-center -mx-6">
                    <div className="lg:w-1/4 xl:w-1/5 pl-6 pr-6 lg:pr-8">
                        <div className="flex items-center">
                            <a href="/" className="block lg:mr-4 text-xl text-white">
                                Presto
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-grow lg:w-3/4 xl:w-4/5">
                        <SearchBar />
                        <div className="hidden lg:flex lg:items-center lg:justify-between xl:w-1/4 px-6">
                            <div className="flex justify-start items-center text-gray-500">
                                <a
                                    className="block flex items-center hover:text-gray-700 mr-5"
                                    href="https://github.com/prestojs/prestojs"
                                >
                                    <svg
                                        className="fill-current w-5 h-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <title>GitHub</title>
                                        <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
