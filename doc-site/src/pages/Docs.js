import React from 'react';
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import { PropTypes } from 'react-view';
import { Form } from '@prestojs/final-form';
import { getWidgetForField, FormItemWrapper } from '@prestojs/ui-antd';
import { UiProvider } from '@prestojs/ui';
import Menu from '../components/Menu';
import Sidebar from '../components/Sidebar';
import View from '../components/View';

import { CharField, EmailField, ViewModel, NumberField } from '@prestojs/viewmodel';

export class User extends ViewModel {
    static label = 'User';
    static labelPlural = 'Users';

    static _fields = {
        id: new NumberField({
            label: 'Id',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        first_name: new CharField({
            label: 'First Name',
        }),
        // eslint-disable-next-line @typescript-eslint/camelcase
        last_name: new CharField({
            label: 'Last Name',
        }),
        email: new EmailField({
            label: 'Email',
        }),
    };
}

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
    console.log(props);
    const {
        data: { mdx },
    } = props;
    return (
        <UiProvider getWidgetForField={getWidgetForField} formItemComponent={FormItemWrapper}>
            <Layout>
                <Sidebar>
                    <Menu items={menuItems} />
                </Sidebar>
                <MDXRenderer scope={{ User, Form, View, PropTypes }}>{mdx.body}</MDXRenderer>
            </Layout>
        </UiProvider>
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
