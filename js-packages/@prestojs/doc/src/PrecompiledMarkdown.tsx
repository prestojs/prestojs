import { run } from '@mdx-js/mdx';
import React, { Fragment, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime.js';
import CodeBlock from './CodeBlock';

const Paragraph = (props): React.ReactElement => <p {...props} className="mb-6" />;
const Code = (props): React.ReactElement => {
    if (props.className?.startsWith('language-')) {
        return <CodeBlock>{props.children}</CodeBlock>;
    }
    return <code {...props} className="bg-yellow-100" />;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useMDXComponents() {
    return {
        p: Paragraph,
        code: Code,
        ul: props => <ul className="m-5" {...props} />,
        li: props => <li className="m-1 list-disc" {...props} />,
        h2: props => {
            if (typeof props.children != 'string') {
                return <h2 {...props} />;
            }
            const id = props.children.replace(/ /g, '_');
            // TODO
            // return <AnchorLink {...props} Component="h2" id={id} className="text-3xl font-bold my-4" />;
            return <h2 className="text-3xl font-bold my-4">{props.children}</h2>;
        },
    };
}

export default function PrecompiledMarkdown({ code }): React.ReactElement {
    const [mdxModule, setMdxModule] = useState<any>(null);
    const Content = mdxModule ? mdxModule.default : Fragment;

    useEffect(() => {
        (async (): Promise<void> => {
            setMdxModule(await run(code, { ...runtime, useMDXComponents }));
        })();
    }, [code]);

    return <Content />;
}
