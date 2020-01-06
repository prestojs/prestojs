import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import { useMDXScope } from 'gatsby-plugin-mdx/context';
import prismTheme from '../prismTheme';
import CodeEditor from './CodeEditor';

// Line highlighting from https://github.com/filoxo/blog/commit/3862bb4f5f5d4ebfafa3f773b7c1687fc8ca5bea
const RE = /{([\d,-]+)}/;

const calculateLinesToHighlight = meta => {
    if (!RE.test(meta)) {
        return () => false;
    } else {
        const lineNumbers = RE.exec(meta)[1]
            .split(',')
            .map(v => v.split('-').map(v => parseInt(v, 10)));
        return index => {
            const lineNumber = index + 1;
            const inRange = lineNumbers.some(([start, end]) =>
                end ? lineNumber >= start && lineNumber <= end : lineNumber === start
            );
            return inRange;
        };
    }
};

const CodeBlock = ({ children, className, live, metastring }) => {
    const language = className ? className.replace(/language-/, '') : '';
    const shouldHighlightLine = calculateLinesToHighlight(metastring);
    const scope = useMDXScope();
    className = className ? className.replace('language-', 'gatsby-code-') : className;
    if (live) {
        return <CodeEditor scope={scope}>{children}</CodeEditor>;
    }
    return (
        <Highlight {...defaultProps} code={children} language={language} theme={prismTheme}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
                <div className="gatsby-highlight">
                    <pre className={className} style={style}>
                        {tokens.map((line, i) => {
                            const lineProps = getLineProps({ line, key: i });
                            if (shouldHighlightLine(i)) {
                                lineProps.className = `${lineProps.className} gatsby-highlight-code-line`;
                            }
                            return (
                                <div key={i} {...lineProps}>
                                    {line.map((token, key) => (
                                        <span key={key} {...getTokenProps({ token, key })} />
                                    ))}
                                </div>
                            );
                        })}
                    </pre>
                </div>
            )}
        </Highlight>
    );
};

export default CodeBlock;
