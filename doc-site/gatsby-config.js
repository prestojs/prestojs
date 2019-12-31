module.exports = {
    siteMetadata: {
        title: `PrestoJS`,
        description: `A javascript library for rapid application development`,
    },
    plugins: [
        'gatsby-plugin-styled-components',
        `gatsby-plugin-react-helmet`,
        'gatsby-transformer-json',
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/src/images`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'pages',
                path: `${__dirname}/src/pages`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'content',
                path: `${__dirname}/content/`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'data',
                path: `${__dirname}/data/`,
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        'gatsby-remark-embed-snippet',
        'gatsby-remark-prismjs',
        {
            resolve: `gatsby-plugin-mdx`,
            options: {
                defaultLayouts: {
                    // posts: require.resolve('./src/components/posts-layout.js'),
                    default: require.resolve('./src/components/layout.js'),
                },
                gatsbyRemarkPlugins: [
                    {
                        resolve: 'gatsby-remark-embed-snippet',
                        options: {
                            classPrefix: 'gatsby-code-',
                            directory: `${__dirname}/examples/`,
                        },
                    },
                    {
                        resolve: 'gatsby-remark-prismjs',
                        options: {
                            classPrefix: 'gatsby-code-',
                        },
                    },
                ],
            },
        },
        // this (optional) plugin enables Progressive Web App + Offline functionality
        // To learn more, visit: https://gatsby.dev/offline
        // `gatsby-plugin-offline`,
    ],
};
