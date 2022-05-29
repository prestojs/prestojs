import cx from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { DocExample } from '../newTypes';
import AnchorLink from './AnchorLink';

import CodeBlock from './CodeBlock';
import Modal from './Modal';
import PrecompiledMarkdown from './PrecompiledMarkdown';

export function CodeExample({ example, language, forceWide }) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState();
    useEffect(() => {
        const listener = e => {
            // This message comes from _app.js
            try {
                const data = JSON.parse(e.data);
                if (
                    e.source.document === iframeRef.current?.contentDocument &&
                    data.type === 'height-change'
                ) {
                    setHeight(data.height);
                }
            } catch (e) {}
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);
    const {
        header: { title, description, tags },
    } = example;
    let minHeight = 100;
    if (tags['min-height']) {
        const h = Number(tags['min-height']);
        if (!Number.isNaN(h)) {
            minHeight = h;
        }
    }
    return (
        <div
            className={cx('border code-example flex flex-col', {
                'col-span-2': tags.wide || forceWide,
            })}
        >
            <iframe
                ref={iframeRef}
                src={example.url}
                width="100%"
                className="z-20 mb-5"
                style={{
                    flex: 1,
                    minHeight: Math.max(minHeight, height || 0),
                }}
            />
            {description && (
                <div className="px-5 relative border-t mb-5">
                    <h3
                        className="relative bg-white inline-block px-1 font-semibold text-lg"
                        style={{ top: -15 }}
                    >
                        {title}
                    </h3>
                    <PrecompiledMarkdown code={description} />
                </div>
            )}
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className="text-blue-700 items-center py-2 w-full text-left pl-5 bg-gray-100"
                    style={{ height: 40 }}
                >
                    Show Code
                </button>{' '}
                <Modal isVisible={open} onClose={() => setOpen(false)}>
                    <CodeBlock
                        children={example.code[language === 'tsx' ? 'ts' : 'js']}
                        className="overflow-x-auto"
                    />
                </Modal>
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

export default function CodeExamples({ examples }: { examples: DocExample[] }) {
    const [language, setLanguage] = useLocalStorageState('codeExamplesLanguage', 'jsx');
    return (
        <div className="my-5">
            <div className="border-b border-gray-400 mb-5 flex justify-between ">
                <AnchorLink component="h2" id="examples" className="font-semibold text-lg">
                    Examples
                </AnchorLink>

                <select
                    value={language}
                    onChange={({ target: { value } }) => setLanguage(value)}
                    className="text-sm"
                >
                    <option value="jsx">Javascript</option>
                    <option value="tsx">Typescript</option>
                </select>
            </div>
            <div
                className={cx('grid gap-4 w-full', {
                    'grip-cols-1': examples.length === 1,
                    'grid-cols-2': examples.length !== 1,
                })}
            >
                {examples.map((example, i) => (
                    <CodeExample
                        key={example.name}
                        example={example}
                        language={language}
                        forceWide={i === examples.length - 1 && i % 2 == 1 && i > 2}
                    />
                ))}
            </div>
        </div>
    );
}
