import '@docsearch/css';
import { DocSearch } from '@docsearch/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

function SearchBar() {
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);
    useEffect(() => {
        setShowSearch(true);
    }, []);
    return (
        <div className="w-full lg:px-6 xl:w-3/4 xl:px-12 px-4">
            <div className="relative">
                {showSearch && (
                    <DocSearch
                        navigator={{
                            navigate({ itemUrl }) {
                                const a = document.createElement('a');
                                a.href = itemUrl;
                                const localUrl = itemUrl.replace(a.origin, '');
                                router.push(localUrl);
                            },
                        }}
                        appId="ZE8YYRQ0LW"
                        indexName="prestojs"
                        apiKey="1cedf39ae06c8abf71a71baf52dee8d7"
                    />
                )}
            </div>
        </div>
    );
}

export default function Header({ onToggleMenu }) {
    return (
        <div className="flex bg-gray-800 sticky top-0 inset-x-0 z-30 h-16 items-center">
            <div className="w-full max-w-screen-xl relative mx-auto px-6">
                <div className="flex items-center -mx-6">
                    <div className="lg:w-1/4 xl:w-1/5 pl-6 pr-6 lg:pr-8">
                        <div className="flex items-center text-white">
                            <button className="mr-2 lg:hidden" onClick={() => onToggleMenu()}>
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
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>
                            <a href="/" className="block lg:mr-4 text-xl">
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
