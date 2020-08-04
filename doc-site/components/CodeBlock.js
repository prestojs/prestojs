import Highlight, { defaultProps } from 'prism-react-renderer';
import React from 'react';
import prismTheme from '../prismTheme';
import CodeEditor from './CodeEditor';
import Collapse from './Collapse';
import useMdxScope from './useMdxScope';

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

export default function CodeBlock({
    children,
    className,
    live,
    collapsable,
    metastring,
    stripImports,
    ...rest
}) {
    const language = className ? className.replace(/language-/, '') : '';
    const shouldHighlightLine = calculateLinesToHighlight(metastring);
    const scope = useMdxScope();
    className = className ? className.replace('language-', 'prism-code-') : className;
    const Wrapper = collapsable ? Collapse : React.Fragment;
    const wrapperProps = {};
    if (collapsable) {
        // Can't pass through more than a single word from MDX... just use
        // underscores to separate words for now
        wrapperProps.title =
            typeof collapsable == 'string' ? collapsable.split('_').join(' ') : 'Code block';
    }
    // Strip extra space - specifically when used in MDX there's a trailing new line we need to get rid of
    children = children.trim();
    if (stripImports) {
        children = children.replace(/import .*/g, '');
    }
    if (live) {
        // Process code loaded from a file. Support prepending content to it... this is so
        // can add rendering code for use with react-view (first thing in the editor gets rendered)
        if (metastring.includes('file=')) {
            const match = metastring.match(/prepend=(.*)/);
            if (match) {
                children = `${match[1]}\n\n${children}`;
            }
            children = children.replace('export default ', '');
            children = children.replace(/export /, '');
        }
        return (
            <Wrapper {...wrapperProps}>
                <CodeEditor {...rest} scope={scope}>
                    {children}
                </CodeEditor>
            </Wrapper>
        );
    }
    return (
        <Wrapper {...wrapperProps}>
            <Highlight {...defaultProps} code={children} language={language} theme={prismTheme}>
                {({ style, tokens, getLineProps, getTokenProps }) => (
                    <div className="prism-highlight">
                        <pre className={className} style={style}>
                            {tokens.map((line, i) => {
                                const lineProps = getLineProps({ line, key: i });
                                if (shouldHighlightLine(i)) {
                                    lineProps.className = `${lineProps.className} prism-highlight-code-line`;
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
        </Wrapper>
    );
}
