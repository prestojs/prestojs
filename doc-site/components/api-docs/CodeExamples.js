import cx from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import RightChevron from '../../assets/icon-right-chevron.svg';
import CodeBlock from '../CodeBlock';

const OPEN_CODE_HEIGHT = 40;

function CodeExample({ example, container, language, showExpand }) {
    const codeRef = useRef();
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState();
    const [expanded, setExpanded] = useState(false);
    const lastExpanded = useRef(expanded);
    useEffect(() => {
        if (lastExpanded.current !== expanded && typeof window !== 'undefined') {
            lastExpanded.current = expanded;
            const top = codeRef.current.getBoundingClientRect().top;
            window.scrollBy({
                top: top - 100,
                behavior: 'smooth',
            });
        }
    }, [expanded]);
    const {
        header: { title, description },
    } = example;
    return (
        <div
            className={cx('border code-example flex flex-col', {
                'col-span-2': open && expanded,
            })}
        >
            <iframe
                src={example.url}
                width="100%"
                height={height}
                className="z-20 mb-5"
                style={{
                    flex: 1,
                    minHeight: 100,
                }}
                onLoad={e =>
                    setHeight(e.target.contentDocument.body.getBoundingClientRect().height)
                }
            />
            <div className="px-5 relative border-t mb-5">
                <h3 className="relative bg-white inline-block px-1" style={{ top: -15 }}>
                    {title}
                </h3>
                {description && (
                    <div className="" dangerouslySetInnerHTML={{ __html: description }} />
                )}
            </div>
            <div
                className={cx('relative', {
                    'z-10': open && expanded,
                })}
            >
                <button
                    onClick={() => setOpen(!open)}
                    className="text-blue-700 items-center py-2 w-full text-left pl-5 bg-gray-100"
                    style={{ height: OPEN_CODE_HEIGHT }}
                >
                    <RightChevron
                        className={`w-4 h-4 mr-5 inline transform ${
                            open ? '-rotate-90' : 'rotate-90'
                        }`}
                    />
                    {open ? 'Hide code' : 'Show code'}
                </button>{' '}
                {open && (
                    <div className="relative" ref={codeRef}>
                        {showExpand && (
                            <button
                                onClick={() => setExpanded(x => !x)}
                                title={expanded ? 'Collapse' : 'Expand'}
                                className="absolute right-0 mr-2 mt-2 text-white opacity-75 hover:opacity-100"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                    />
                                </svg>
                            </button>
                        )}
                        <CodeBlock
                            children={example.code[language === 'tsx' ? 'ts' : 'js']}
                            className={`language-${language}`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function useLocalStorageState(key, defaultValue) {
    const localStorage = typeof window != 'undefined' ? window.localStorage : null;
    const [value, setValue] = useState((localStorage && localStorage.getItem(key)) || defaultValue);
    useEffect(() => {
        if (localStorage && value !== localStorage.getItem(key)) {
            localStorage.setItem(key, value);
        }
    }, [key, localStorage, value]);

    return [value, setValue];
}

export default function CodeExamples({ examples }) {
    const containerRef = useRef();
    const [language, setLanguage] = useLocalStorageState('codeExamplesLanguage', 'jsx');
    return (
        <div className="my-5" ref={containerRef}>
            <h3 className="text-4xl mb-5 flex justify-between">
                Examples
                <select
                    value={language}
                    onChange={({ target: { value } }) => setLanguage(value)}
                    className="text-sm"
                >
                    <option value="jsx">Javascript</option>
                    <option value="tsx">Typescript</option>
                </select>
            </h3>
            <div
                className={cx('grid gap-4 w-full', {
                    'grip-cols-1': examples.length === 1,
                    'grid-cols-2': examples.length !== 1,
                })}
            >
                {examples.map(example => (
                    <CodeExample
                        key={example.name}
                        example={example}
                        container={containerRef}
                        language={language}
                        showExpand={examples.length > 1}
                    />
                ))}
            </div>
        </div>
    );
}
