import { MDXProvider } from '@mdx-js/react';
import MDX from '@mdx-js/runtime';
import dynamic from 'next/dynamic';
import React from 'react';
import mdxComponents from '../mdxComponents';
import { MdxScopeContext } from '../useMdxScope';

const Wrapper = dynamic(async () => {
    const useAsync = (await import('@prestojs/util')).useAsync;

    return props => (
        <MdxScopeContext.Provider
            value={{
                useAsync,
            }}
        >
            {props.children}
        </MdxScopeContext.Provider>
    );
});

export default function MdxWrapper({ mdx }) {
    if (!mdx) {
        return null;
    }
    if (mdx.live) {
        return (
            <MDXProvider
                components={{
                    ...mdxComponents,
                    wrapper: Wrapper,
                }}
            >
                <div className="mdx">
                    {mdx.shortText && <MDX>{mdx.shortText.trim()}</MDX>}
                    {mdx.text && <MDX>{mdx.text.trim()}</MDX>}
                </div>
            </MDXProvider>
        );
    }
    return <div className="mdx" dangerouslySetInnerHTML={{ __html: mdx }} />;
}
