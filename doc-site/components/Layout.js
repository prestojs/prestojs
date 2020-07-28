import { MDXProvider } from '@mdx-js/react';
import { UiProvider } from '@prestojs/ui';
import { FormItemWrapper, FormWrapper } from '@prestojs/ui-antd';
import cx from 'classnames';
import Head from 'next/head';
import React from 'react';
import getFormatterForField from '../getFormatterForField';

import getWidgetForField from '../getWidgetForField';
import Article from './Article';
import Header from './Header';
import MainMenuSidebar from './MainMenuSidebar';
import mdxComponents from './mdxComponents';
import Sidebar from './Sidebar';
import { MdxScopeContext } from './useMdxScope';

function MDXWrapper({ metadata = {}, children, ...props }) {
    const { scope = {} } = metadata;
    let sideLinkIds;
    if (metadata.generateInThisPage) {
        const matches = children.filter?.(
            child => child.props.originalType === 'h2' && typeof child.props.children === 'string'
        );
        if (matches) {
            // Should be kept in sync with mdxComponents.js where it generates id in h2 component
            sideLinkIds = matches.map(child => child.props.children.replace(/ /g, '_'));
        }
    }
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
            <Article {...props}>
                <div className={cx('mdx', metadata.className)}>{children}</div>
            </Article>
            {sideLinkIds?.length > 0 && (
                <Sidebar>
                    <Sidebar.LinksSection
                        title="On This Page"
                        links={sideLinkIds.map(linkId => ({
                            href: `#${linkId}`,
                            title: linkId.split('_').join(' '),
                        }))}
                    />
                </Sidebar>
            )}
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
                <div className="w-full max-w-screen-2xl mx-auto px-6">
                    <div className="lg:flex -mx-6">
                        {children}
                        <footer>© {new Date().getFullYear()}</footer>
                    </div>
                </div>
            </UiProvider>
        </MDXProvider>
    );
}
