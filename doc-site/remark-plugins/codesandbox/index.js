/* eslint-disable @typescript-eslint/no-var-requires */

const qs = require('qs');
const visit = require('unist-util-visit');
const util = require('util');
const fs = require('fs');
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const { getParameters } = require('codesandbox/lib/api/define');
require('isomorphic-unfetch');
const FormData = require('form-data');
const parseSandbox = require('codesandbox/lib/utils/parse-sandbox').default;

const cache = new Map();

function getSandboxUrl(id, type, fileName) {
    return `https://codesandbox.io/${type}/${id}?module=/${fileName}`;
}

/**
 * Load styles to use in sandbox examples
 *
 * Reads from 'style.css' and builds with tailwind
 */
async function getStyles(cwd) {
    const inPath = path.resolve(__dirname, 'styles.css');
    const outPath = path.resolve(__dirname, 'output.css');
    if (fs.existsSync(outPath)) {
        const a = fs.statSync(outPath);
        const b = fs.statSync(inPath);
        if (a.mtime >= b.mtime) {
            return outPath;
        }
    }
    await exec(`npx tailwind build ${inPath} -o ${outPath}`);

    return outPath;
}

async function generateSandbox(dir) {
    const result = await parseSandbox(path.resolve(dir));
    result.files['src/tailwind.css'] = {
        content: fs.readFileSync(await getStyles(), 'utf8'),
    };
    const parameters = getParameters(result);
    if (cache.has(parameters)) {
        return cache.get(parameters);
    }
    let formData = new FormData();
    formData.append('parameters', parameters);
    const type = 's';
    const fileName = 'src/index.js';
    return await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'post',
        body: formData,
        mode: 'cors',
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            console.error(response);
            throw new Error('Invalid response from codesandbox');
        })
        .then(({ errors, sandbox_id }) => {
            if (errors) throw errors;
            const result = {
                sandboxId: sandbox_id,
                sandboxUrl: getSandboxUrl(sandbox_id, type, fileName),
            };
            cache.set(parameters, result);
            return result;
        });
}

/**
 */
module.exports = function codesandbox() {
    return async (tree, file) => {
        const promises = [];
        visit(tree, ['code'], node => {
            const meta = (node.meta || '').split(' ').reduce((acc, entry) => {
                const [key, value] = entry.split('=');
                acc[key] = value;
                return acc;
            }, {});
            const filePath = meta.codesandbox;

            if (!filePath) {
                return;
            }
            const fileAbsPath = path.resolve(__dirname, '../../codesandbox-examples', filePath);

            if (!fs.existsSync(fileAbsPath)) {
                const msg = `Codesandbox link for ${filePath} does not exist. Path should be relative to doc-site/codesandbox-examples/.`;
                console.error(msg);
                node.value = msg;
                return;
            }
            const {
                view = 'preview',
                highlights,
                size,
                editorsize = 50,
                hidenavigation = 0,
            } = meta;
            const query = {
                codemirror: 1,
                module: 'src/index.js',
                view,
                hidenavigation,
                editorsize,
            };
            if (highlights) {
                query.highlights = highlights
                    .split(',')
                    .reduce((acc, line) => {
                        const parts = line.split('-');
                        if (parts.length === 2) {
                            const [start, end] = parts.map(Number);
                            acc.push(...Array.from({ length: end - start }, (_, i) => i + start));
                        } else {
                            acc.push(line);
                        }
                        return acc;
                    }, [])
                    .join(',');
            }
            const sizes = {
                small: '200px',
                medium: '500px',
                large: '800px',
            };
            if (size && !sizes[size]) {
                console.error(
                    `Invalid size=${size} specified. Valid options are ${Object.keys(sizes).join(
                        ', '
                    )}`
                );
            }
            const height = sizes[size] || sizes.medium;
            const queryString = qs.stringify(query);
            const promise = generateSandbox(fileAbsPath, file.cwd)
                .then(result => {
                    node.type = 'html';
                    node.value = `<iframe
                src="https://codesandbox.io/embed/${result.sandboxId}?${queryString}"
                class="my-10"
                style="width:100%; height:${height}; border:0; border-radius: 4px; overflow:hidden;"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            ></iframe>`;
                    delete node.children;
                    delete node.lang;
                    delete node.meta;
                    delete node.position;
                })
                .catch(e => {
                    const msg = `Failed to generate sandbox for ${filePath}:`;
                    console.error(msg, e);
                    node.value = `${msg} ${e}`;
                });
            promises.push(promise);
        });
        await Promise.all(promises);
    };
};
