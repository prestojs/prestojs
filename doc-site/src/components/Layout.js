/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import { MDXProvider } from '@mdx-js/react';
import React from 'react';
import PropTypes from 'prop-types';
import { useStaticQuery, graphql } from 'gatsby';
import styled, { ThemeProvider } from 'styled-components';
import { FormItemWrapper } from '@prestojs/ui-antd';
import { UiProvider } from '@prestojs/ui';

import getWidgetForField from '../getWidgetForField';
import theme from '../theme';
import CodeBlock from './CodeBlock';
import CodeEditor from './CodeEditor';
import Header from './Header';
import './Layout.css';
import View from './View';

const Main = styled.main`
    display: flex;
    margin-top: ${props => props.theme.headerHeight};
    min-height: calc(100% - ${props => props.theme.headerHeight});
    padding-top: 60px;
`;

const Layout = ({ children }) => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `);

    return (
        <MDXProvider components={{ View, CodeEditor, code: CodeBlock }}>
            <UiProvider getWidgetForField={getWidgetForField} formItemComponent={FormItemWrapper}>
                <ThemeProvider theme={theme}>
                    <Header siteTitle={data.site.siteMetadata.title} />
                    <div
                        style={{
                            margin: `0 auto`,
                            maxWidth: 1260,
                            padding: `0px 2rem 1.45rem`,
                            paddingTop: 0,
                        }}
                    >
                        <Main>{children}</Main>
                        <footer>
                            © {new Date().getFullYear()}, Built with
                            {` `}
                            <a href="https://www.gatsbyjs.org">Gatsby</a>
                        </footer>
                    </div>
                </ThemeProvider>
            </UiProvider>
        </MDXProvider>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;
