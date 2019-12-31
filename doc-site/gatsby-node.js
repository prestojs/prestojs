// eslint-disable-next-line
const path = require('path');

// Using react-view was getting issues with "Can't resolve 'fs' in '....@babel/core/lib/transformation'
// This seems wrong but it seems to fix it
exports.onCreateWebpackConfig = ({ actions }) => {
    actions.setWebpackConfig({
        node: {
            fs: 'empty',
        },
    });
};

exports.createPages = async ({ graphql, actions, reporter }) => {
    // Destructure the createPage function from the actions object
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

    // Create blog post pages.
    const posts = result.data.allMdx.edges;

    const docsTemplate = path.resolve(`./src/pages/Docs.js`);
    const tutorialTemplate = path.resolve(`./src/pages/Tutorial.js`);

    // you'll call `createPage` for each result
    posts.forEach(({ node }, index) => {
        const { frontmatter = {} } = node;
        const slug = frontmatter.slug || '';
        let template = path.resolve(`./src/components/Layout.js`);
        console.log({ slug });
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
};
