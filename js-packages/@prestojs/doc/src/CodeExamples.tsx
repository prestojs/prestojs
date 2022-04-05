import cx from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import CodeBlock from './CodeBlock';
import Modal from './Modal';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import { DocExample } from './types';

function CodeExample({ example, language }) {
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
        header: { title, description },
    } = example;
    return (
        <div className="border code-example flex flex-col">
            <iframe
                ref={iframeRef}
                src={example.url}
                width="100%"
                className="z-20 mb-5"
                style={{
                    flex: 1,
                    minHeight: height ? height : 100,
                }}
            />
            {description && (
                <div className="px-5 relative border-t mb-5">
                    <h3 className="relative bg-white inline-block px-1" style={{ top: -15 }}>
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
                    <CodeExample key={example.name} example={example} language={language} />
                ))}
            </div>
        </div>
    );
}
