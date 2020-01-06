/* eslint-disable */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function digest(content) {
    return crypto
        .createHash(`md5`)
        .update(content)
        .digest(`hex`);
}

exports.onCreateWebpackConfig = ({ actions }) => {
    actions.setWebpackConfig({
        resolve: {
            alias: {
                docSite: path.resolve(__dirname, './src'),
            },
        },
        // Using react-view was getting issues with "Can't resolve 'fs' in '....@babel/core/lib/transformation'
        // This seems wrong but it seems to fix it
        node: {
            fs: 'empty',
        },
    });
};

exports.createPages = async ({ graphql, actions, reporter }) => {
    const { createPage } = actions;

    const result = await graphql(`
        query {
            allMdx {
                edges {
                    node {
                        id
                        frontmatter {
                            slug
                        }
                    }
                }
            }
        }
    `);

    if (result.errors) {
        reporter.panicOnBuild('🚨  ERROR: Loading "createPages" query');
    }

    const mdxPages = result.data.allMdx.edges;

    const docsTemplate = path.resolve(`./src/pages/Docs.js`);
    const tutorialTemplate = path.resolve(`./src/pages/Tutorial.js`);
    const apiTemplate = path.resolve('./src/pages/Api.js');

    mdxPages.forEach(({ node }, index) => {
        const { frontmatter = {} } = node;
        const slug = frontmatter.slug || '';
        let template = path.resolve(`./src/components/Layout.js`);
        if (!slug) {
            reporter.warn(`${node.id} missing slug`);
            return;
        }

        if (slug.includes('docs/') || slug.includes('tutorial/')) {
            if (slug.includes('docs/')) {
                template = docsTemplate;
            } else if (slug.includes('tutorial/')) {
                template = tutorialTemplate;
            }
        }
        createPage({
            // This is the slug you created before
            // (or `node.frontmatter.slug`)
            path: frontmatter.slug,
            // This component will wrap our MDX content
            component: template,
            // You can use the values in this context in
            // our page layout component
            context: { id: node.id },
        });
    });

    const apiMenu = {};
    const docsData = await graphql(`
        query {
            allTypeDocsJson(filter: { extractDocs: { eq: true } }) {
                edges {
                    node {
                        id
                        slug
                        packageName
                        name
                    }
                }
            }
        }
    `);
    if (docsData.errors) {
        reporter.panicOnBuild('🚨  ERROR: Loading "typeDocsJson" query');
    }
    for (const datum of docsData.data.allTypeDocsJson.edges) {
        const { slug, packageName, name, id } = datum.node;
        if (!apiMenu[packageName]) {
            apiMenu[packageName] = [];
        }
        apiMenu[packageName].push({
            title: name,
            href: slug,
        });
        createPage({
            path: slug,
            component: apiTemplate,
            context: { id, slug },
        });
    }
    fs.writeFileSync('./data/apiMenu.json', JSON.stringify(apiMenu, null, 2));
};

// exports.onCreateNode = ({ node, actions }) => {
//     const { createNode, createNodeField } = actions;
//     // Releases Nodes
//     if (node.internal.type === `TypeDocsJson`) {
//         console.log(node.name, node.id);
//         if (node.comment && node.comment.text) {
//             const textNode = {
//                 id: `${node.id}-MarkdownBody`,
//                 parent: node.id,
//                 dir: path.resolve('./'),
//                 internal: {
//                     type: `${node.internal.type}MarkdownBody`,
//                     mediaType: 'text/markdown',
//                     content: node.comment.text,
//                     contentDigest: digest(node.comment.text),
//                 },
//             };
//             createNode(textNode);
//             console.log(node.id);
//
//             // Create markdownBody___NODE field
//             createNodeField({
//                 node,
//                 name: `markdownBody___NODE`,
//                 value: textNode.id,
//             });
//         }
//         if (node.childIds) {
//             createNodeField({
//                 node,
//                 name: `wtf`,
//                 value: 'hello',
//             });
//         }
//         // // Add text/markdown node children to Release node
//         // const textNode = {
//         //     id: `${node.id}-MarkdownBody`,
//         //     parent: node.id,
//         //     dir: path.resolve('./'),
//         //     internal: {
//         //         type: `${node.internal.type}MarkdownBody`,
//         //         mediaType: 'text/markdown',
//         //         content: node.body,
//         //         contentDigest: digest(node.body),
//         //     },
//         // };
//         // createNode(textNode);
//         //
//         // // Create markdownBody___NODE field
//         // createNodeField({
//         //     node,
//         //     name: 'markdownBody___NODE',
//         //     value: textNode.id,
//         // });
//     }
// };
const mdx = require('gatsby-plugin-mdx/utils/mdx');
const createMdxNode = require('gatsby-plugin-mdx/utils/create-mdx-node');

exports.createSchemaCustomization = ({ actions, schema }) => {
    // These converts comments blocks in JSON to use mdx
    actions.createFieldExtension({
        name: 'mdx',
        args: {},
        extend(options, prevFieldConfig) {
            return {
                async resolve(source, args, context, info) {
                    const fieldValue = context.defaultFieldResolver(source, args, context, info);
                    if (!fieldValue) {
                        return fieldValue;
                    }
                    return createMdxNode({
                        id: '123',
                        node: {
                            id: '123',
                            internal: {},
                        },
                        content: fieldValue,
                    });
                    return {
                        rawBody: await mdx(fieldValue),
                    };
                },
            };
        },
    });
    actions.createTypes(`
    type TypeDocsJsonDocumentation implements Node {
        contents: Mdx @mdx
    } 
    type TypeDocsJsonComment implements Node {
      text: Mdx @mdx
      shortText: Mdx @mdx
    }
    type TypeDocsJsonSignaturesComment implements Node {
      text: Mdx @mdx
      shortText: Mdx @mdx
    }
    type TypeDocsJsonSignaturesParametersComment implements Node {
      text: Mdx @mdx
      shortText: Mdx @mdx
    }
    type TypeDocsJsonChildNodesComment implements Node {
      text: Mdx @mdx
      shortText: Mdx @mdx
    }
    type TypeDocsJsonChildNodesSignaturesParametersComment implements Node {
      text: Mdx @mdx
      shortText: Mdx @mdx
    }
  `);
};
