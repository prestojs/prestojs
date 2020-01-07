import React from 'react';
import { graphql } from 'gatsby';
import Article from '../components/Article';
import MDXRenderer from '../components/MDXRenderer';
import Menu from '../components/Menu';
import Sidebar from '../components/Sidebar';

import Layout from '../components/Layout';

const menuItems = [
    {
        title: 'Installation',
        children: [
            {
                title: 'Getting Started',
                href: '/docs/getting-started.html',
            },
        ],
    },
    {
        title: 'Concepts',
        children: [
            {
                title: 'View Model',
                href: '/docs/view-model.html',
            },
        ],
    },
];

const Docs = props => {
    const {
        data: { mdx },
    } = props;
    return (
        <Layout>
            <Sidebar>
                <Menu items={menuItems} />
            </Sidebar>
            <Article>
                <MDXRenderer>{mdx.body}</MDXRenderer>
            </Article>
        </Layout>
    );
};

export const pageQuery = graphql`
    query TemplateDocsMDX($id: String) {
        mdx(id: { eq: $id }) {
            id
            body
            frontmatter {
                title
            }
        }
    }
`;

export default Docs;
