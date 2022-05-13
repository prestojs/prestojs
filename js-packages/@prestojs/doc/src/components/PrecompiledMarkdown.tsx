import { run } from '@mdx-js/mdx';
import cx from 'classnames';
import React, { Fragment, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import AnchorLink, { generateId } from './AnchorLink';
import CodeBlock from './CodeBlock';

const Paragraph = (props): React.ReactElement => <p {...props} className="mb-6" />;
const Code = (props): React.ReactElement => {
    if (props.className?.startsWith('language-')) {
        return <CodeBlock className="my-5">{props.children}</CodeBlock>;
    }
    return <code {...props} className="bg-yellow-100" />;
};

const Alert = ({
    type = 'warning',
    children,
}: {
    type: 'warning' | 'info' | 'danger';
    children: React.ReactNode;
}) => {
    let className = 'bg-amber-50 border-amber-200';
    if (type === 'info') {
        className = 'bg-sky-50 border-sky-300';
    } else if (type === 'danger') {
        className = 'bg-rose-50 border-rose-300';
    }
    return (
        <blockquote className={`py-4 pl-6 pr-3 -mx-2 my-5 border-l-4 ${className}`}>
            {children}
        </blockquote>
    );
};

function Heading({
    component,
    children,
    className,
}: {
    className?: string;
    component: 'h1' | 'h2' | 'h3' | 'h4';
    children: string;
}) {
    const id = generateId(children);
    return (
        <AnchorLink component={component} id={id} className={cx('font-bold my-4', className)}>
            {children}
        </AnchorLink>
    );
}

export const mdxComponents = {
    wrapper: props => <span className="mdx" {...props} />,
    p: Paragraph,
    code: Code,
    ul: props => <ul className="m-5" {...props} />,
    li: props => <li className="m-1 list-disc" {...props} />,
    h1: props => {
        if (typeof props.children != 'string') {
            return <h1 {...props} />;
        }
        return <Heading component="h1">{props.children}</Heading>;
    },
    h2: props => {
        if (typeof props.children != 'string') {
            return <h2 {...props} />;
        }
        return <Heading component="h2">{props.children}</Heading>;
    },
    h3: props => {
        if (typeof props.children != 'string') {
            return <h3 {...props} />;
        }
        return <Heading component="h3">{props.children}</Heading>;
    },
    blockquote: Alert,
    Alert,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useMDXComponents() {
    return mdxComponents;
}

export default function PrecompiledMarkdown({ code }): React.ReactElement {
    const [mdxModule, setMdxModule] = useState<any>(null);
    const Content = mdxModule ? mdxModule.default : Fragment;

    useEffect(() => {
        (async (): Promise<void> => {
            try {
                setMdxModule(await run(code, { ...runtime, useMDXComponents }));
            } catch (e) {
                console.log('Error generating mdx', code);
            }
        })();
    }, [code]);

    return (
        <span className="mdx">
            <Content />
        </span>
    );
}
