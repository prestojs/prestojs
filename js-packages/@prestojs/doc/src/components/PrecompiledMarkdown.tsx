import { run } from '@mdx-js/mdx';
import cx from 'classnames';
import Link from 'next/link';
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

export const Alert = ({
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

function WidgetUsage({
    children,
    widgetName = 'Widget',
}: {
    children: React.ReactNode;
    widgetName?: string;
}) {
    return (
        <>
            <Alert type="info">
                <p>
                    See the <Link href="/docs/ui#Widgets">widget guide</Link> for more details on
                    how widgets work within a form.
                </p>
                <div className="my-5">
                    Most usages of a widget are selected using{' '}
                    <Link href="/docs/ui-antd/getWidgetForField">getWidgetForField</Link> or by
                    passing it to <Link href="/docs/final-form/FormField">FormField</Link> or{' '}
                    <Link href="/docs/final-form/FormItem">FormItem</Link>
                    <details>
                        <summary className="cursor-pointer decoration-dashed underline">
                            More Details
                        </summary>
                        <p className="my-5">
                            Using <Link href="/docs/final-form/FormField">FormField</Link>
                        </p>
                        <CodeBlock className="my-5">{`<Form.Field
  field={ExampleModel.fields.exampleField}
  component={${widgetName}} 
/>`}</CodeBlock>
                        <CodeBlock className="my-5">{`<Form.Field
  field={ExampleModel.fields.exampleField}
  render={widgetProps => <${widgetName} {...fieldProps} />}
/>`}</CodeBlock>
                        <p className="my-5">
                            or to <Link href="/docs/final-form/FormItem">FormItem</Link>
                        </p>
                        <CodeBlock className="my-5">{`<Form.Item
  field={ExampleModel.fields.exampleField}
  fieldProps={{ component: ${widgetName}}}
/>`}</CodeBlock>
                        <CodeBlock className="my-5">{`<Form.Item
  field={ExampleModel.fields.exampleField}
  fieldProps={{ render: widgetProps => <${widgetName} {...fieldProps} /> }}
/>`}</CodeBlock>
                    </details>
                </div>
            </Alert>
            <p className="m-5 font-semibold">
                To use outside of a form where state is manually tracked:
            </p>
            {children}
        </>
    );
}

function Usage({ type = 'generic', children, ...rest }) {
    let contents = children;
    if (type === 'widget') {
        contents = <WidgetUsage children={children} {...rest} />;
    }
    return (
        <div>
            <Heading component="h2">Usage</Heading>
            {contents}
        </div>
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
    Usage,
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
