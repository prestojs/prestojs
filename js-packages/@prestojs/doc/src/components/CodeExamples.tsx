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
        header: { title, anchorId, description, tags },
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
            <div className="px-5  border-t mb-5">
                <AnchorLink
                    id={anchorId}
                    component="h3"
                    className="relative bg-white inline-flex px-1 font-semibold text-lg"
                    style={{ top: -15 }}
                >
                    {title}
                </AnchorLink>
                {description && <PrecompiledMarkdown code={description} />}
            </div>
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
    // Group examples into rows of 2 or 1 if the 'wide' tag is set
    const { rows, currentRow } = examples.reduce(
        (acc, example, i) => {
            if (example.header.tags.wide) {
                if (acc.currentRow.length > 0) {
                    acc.rows.push(acc.currentRow);
                    acc.currentRow = [];
                }
                acc.rows.push([example]);
            } else {
                acc.currentRow.push(example);
                if (acc.currentRow.length === 2) {
                    acc.rows.push(acc.currentRow);
                    acc.currentRow = [];
                }
            }
            return acc;
        },
        { rows: [], currentRow: [] } as { rows: DocExample[][]; currentRow: DocExample[] }
    );
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
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
                {rows.map(examples =>
                    examples.map(example => (
                        <CodeExample
                            key={example.name}
                            example={example}
                            language={language}
                            forceWide={examples.length === 1}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
