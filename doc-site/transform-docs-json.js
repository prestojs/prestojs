const genMDX = require('gatsby-plugin-mdx/utils/gen-mdx');
const withDefaultOptions = require(`gatsby-plugin-mdx/utils/default-options`);

async function mdxify(content) {
    try {
        // TODO: I have no idea what problems faking this is going to cause...
        const node = {
            rawBody: content,
        };
        const options = withDefaultOptions({});
        return await genMDX(
            {
                isLoader: false,
                options,
                node,
                getNodes: () => [],
            },
            { forceDisableCache: true }
        );
    } catch (e) {
        return {
            mdxInvalid: String(e),
        };
    }
}

module.exports = async function transformDocs(data) {
    const transformedData = data.children.filter(child => child.name.startsWith('@presto'));

    async function transformComment(comment) {
        if (!comment) {
            return comment;
        }

        return {
            text: comment.text && (await mdxify(comment.text)),
            shortText: comment.shortText && (await mdxify(comment.shortText)),
            returns: comment.returns && (await mdxify(comment.returns)),
        };
    }

    function getAttributesFromTags(tags) {
        const attributes = {};

        (tags || []).forEach(tag => {
            if (tag.tag === 'extract-docs') {
                attributes.extractDocs = true;
            }
        });

        return attributes;
    }

    const toResolve = [];

    async function transformType(type) {
        if (type.type === 'reference') {
            const details = {
                referenceId: type.id,
                TODO: 'HOW?',
            };
            toResolve.push(details);
            return details;
        }
        if (type.type === 'reflection') {
            const { declaration, ...rest } = type;
            return {
                ...rest,
                declaration: await transformNode(declaration),
            };
        }
        if (type.type === 'array') {
            return {
                ...type,
                elementType: await transformType(type.elementType),
            };
        }
        if (type.type === 'union' || type.type === 'intersection') {
            return {
                ...type,
                types: await Promise.all(type.types.map(transformType)),
            };
        }
        return type;
    }

    function transformParameter(param) {
        return transformNode(param);
    }

    async function transformSignature(signature) {
        const { id, name, flags, comment, parameters, type: returnType } = signature;

        return {
            id,
            name,
            flags,
            comment: await transformComment(comment),
            parameters: parameters ? await Promise.all(parameters.map(transformParameter)) : [],
            returnType: await transformType(returnType),
            ...getAttributesFromTags(comment && comment.tags),
        };
    }

    async function transformNode(node) {
        const { id, kindString, name, type, comment, sources, flags, signatures, groups } = node;
        const children = node.children && (await Promise.all(node.children.map(transformNode)));
        const byId =
            children &&
            children.reduce((acc, child) => {
                acc[child.id] = child;
                return acc;
            }, {});

        const transformedNode = {
            id,
            name,
            kindString,
            comment: await transformComment(comment),
            flags,
            source: sources && sources[0],
            children,
            groups:
                groups &&
                groups.map(group => ({
                    title: group.title,
                    children: group.children.map(id => byId[id]),
                })),
            signatures: signatures && (await Promise.all(signatures.map(transformSignature))),
            type: type && (await transformType(type)),
            ...getAttributesFromTags(comment && comment.tags),
        };

        if (sources) {
            const { fileName } = sources[0];
            const importPath = fileName
                .replace('js-packages/', '')
                .replace('src/', '')
                .split('.')[0];
            const slug = [...importPath.split('/').slice(0, -1), name].join('/');
            const permaLink = `/api/${slug}.html`;
            const [, packageName, ...names] = slug.split('/');
            transformedNode.slug = permaLink;
            transformedNode.packageName = packageName;
        }

        return transformedNode;
    }

    const childrenById = {};

    for (const entry of transformedData) {
        for (const child of entry.children) {
            childrenById[child.id] = await transformNode(child);
        }
    }

    toResolve.forEach(node => {
        Object.assign(node, childrenById[node.referenceId]);
    });

    /**
     * Transform package level structure
     * {
     *     id: 1,
     *     "name": "@prestojs/codegen",
     *     ...
     *     "children": [...],
     *     "groups": [
     *         {
     *             "title": "Classes",
     *             "children": [ 2, 3, 4, ]
     *         }
     *     ]
     * }
     */
    async function transformPackage(pkg) {
        const { groups } = pkg;

        return {
            ...(await transformNode(pkg)),
            groups: groups.map(group => ({
                title: group.title,
                children: group.children
                    .map(id => childrenById[id])
                    .filter(child => child.extractDocs),
            })),
        };
    }

    return await Promise.all(transformedData.map(transformPackage));
};

// const data = require('./data/typeDocs.json');
// const fs = require('fs');
// const packageDocs = module.exports(data).then(r => {
//     console.log(r);
//     fs.writeFileSync(`packageDocs.json`, JSON.stringify(r, null, 2));
// });
