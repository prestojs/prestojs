/* eslint-disable @typescript-eslint/no-var-requires */
const visit = require('unist-util-visit');
const fs = require('fs');
const path = require('path');

/**
 * Converts links like [useAsync](doc:useAsync) into the full URL for the documentation
 * for the referenced item.
 */
module.exports = function docLinks() {
    let docsJson;
    return tree => {
        visit(tree, ['link', 'linkReference'], node => {
            if (node.url && node.url.startsWith('doc:')) {
                if (!docsJson) {
                    try {
                        const fn = path.join(process.cwd(), 'data/typeDocs.json');
                        docsJson = JSON.parse(fs.readFileSync(fn, 'utf-8')).reduce((acc, item) => {
                            acc[item.name] = item;
                            return acc;
                        }, {});
                    } catch (err) {
                        console.error(
                            'Failed loading ./data/typeDocs.json... does it exist? Run cd doc-site && node extract-docs.js'
                        );
                    }
                }
                if (docsJson) {
                    const [name, hash] = node.url.split(':')[1].split('#');
                    const target = docsJson[name];
                    if (target) {
                        let url = `/docs/${target.slug}`;
                        if (hash) {
                            url += `#${hash}`;
                        }
                        node.url = url;
                    } else {
                        console.warn(`${node.url} does not match the name of any documented item`);
                    }
                }
            }
        });
    };
};
