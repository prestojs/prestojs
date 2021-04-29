const postcss = require('postcss');
const PostCSSPrefixWrap = require('postcss-prefixwrap/build/PostCSSPrefixWrap').default;

/**
 * Prefix all antd styles with the 'doc-antd' class so doesn't pollute global styles
 *
 * I couldn't work out how to pass `options` to postcss-prefixwrap when passing plugin in
 * postcss.config.js so this is my workaround.
 */
module.exports = postcss.plugin('prefix-antd-styles', () => {
    const prefixSelector = '.doc-antd';
    const options = {
        whitelist: ['.*/antd/.*'],
    };
    return new PostCSSPrefixWrap(prefixSelector, options).prefix();
});
