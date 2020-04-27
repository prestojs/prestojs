import Head from 'next/head';
import { MDXProvider } from '@mdx-js/react';
import { UiProvider } from '@prestojs/ui';
import { FormItemWrapper, FormWrapper } from '@prestojs/ui-antd';
import React from 'react';
import getFormatterForField from '../getFormatterForField';

import getWidgetForField from '../getWidgetForField';
import Article from './Article';
import Header from './Header';
import MainMenuSidebar from './MainMenuSidebar';
import mdxComponents from './mdxComponents';
import Sidebar from './Sidebar';
import { MdxScopeContext } from './useMdxScope';

function MDXWrapper({ metadata = {}, ...props }) {
    const { scope = {} } = metadata;
    return (
        <MdxScopeContext.Provider value={scope}>
            {metadata && metadata.title && (
                <Head>
                    <title>Presto - {metadata.title}</title>
                </Head>
            )}
            <MainMenuSidebar>
                {metadata &&
                    metadata.sideBarSections &&
                    metadata.sideBarSections.map((section, i) => (
                        <Sidebar.LinksSection key={i} title={section.title} links={section.links} />
                    ))}
            </MainMenuSidebar>
            <Article {...props} />
        </MdxScopeContext.Provider>
    );
}

export default function Layout({ children }) {
    return (
        <MDXProvider
            components={{
                ...mdxComponents,
                wrapper: MDXWrapper,
            }}
        >
            <Head>
                <title>Presto</title>
            </Head>
            <UiProvider
                getWidgetForField={getWidgetForField}
                getFormatterForField={getFormatterForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <Header />
                <div className="w-full max-w-screen-xl mx-auto px-6">
                    <div className="lg:flex -mx-6">
                        {children}
                        <footer>© {new Date().getFullYear()}</footer>
                    </div>
                </div>
            </UiProvider>
        </MDXProvider>
    );
}
