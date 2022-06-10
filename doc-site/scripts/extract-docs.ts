import babel from '@babel/core';
import { compile } from '@mdx-js/mdx';
import type {
    ClassConstructor,
    ClassPage,
    ContainerType,
    DocExample,
    DocNode,
    DocType,
    ExternalReferenceType,
    Flags,
    FunctionPage,
    IndexSignatureType,
    InterfaceType,
    MethodType,
    Page,
    PageSection,
    ReferenceLinkType,
    RichDescription,
    Signature,
    TypeParameter,
    UnknownType,
    VariableNode,
} from '@prestojs/doc';
import fs from 'fs';
import { createRequire } from 'module';
import path, { dirname } from 'path';

import prettier from 'prettier';
import TypeDoc, { JSONOutput } from 'typedoc';
import { visit } from 'unist-util-visit';
import { fileURLToPath } from 'url';

type DeclarationReflection = JSONOutput.DeclarationReflection;

function getTsFiles(dir): string[] {
    if (dir.endsWith('__tests__')) {
        return [];
    }
    const files: string[] = [];
    for (const f of fs.readdirSync(dir)) {
        if (f === 'index.ts') {
            continue;
        }
        const fn = path.join(dir, f);
        if (fs.statSync(fn).isDirectory()) {
            files.push(...getTsFiles(fn));
        } else if (fn.endsWith('ts') || fn.endsWith('tsx')) {
            files.push(fn);
        }
    }
    return files;
}

function getComment(docItem: JSONOutput.DeclarationReflection) {
    let { comment } = docItem;
    if (!comment && docItem.signatures) {
        comment = docItem.signatures[0].comment;
    }
    return comment;
}

function getTagByName(docItem: JSONOutput.DeclarationReflection, tagName: string) {
    return getComment(docItem)?.tags?.find(tag => tag.tag === tagName);
}

function getSlug(docItem) {
    const { fileName = '' } = docItem.sources?.[0] || {};
    const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
    return [...importPath.split('/').slice(1, -1), docItem.name].join('/');
}

function makeDocLinksPlugin(docsJson) {
    return () => tree => {
        visit(tree, ['link', 'linkReference'], node => {
            if (node.url && node.url.startsWith('doc:')) {
                const [name, hash] = node.url.split(':')[1].split('#');
                const target = docsJson[name];
                if (target) {
                    let url = `/docs/${getSlug(target)}`;
                    if (hash) {
                        url += `#${hash}`;
                    }
                    node.url = url;
                } else {
                    console.warn(`${node.url} does not match the name of any documented item`);
                }
            }
        });
    };
}

function formatWithPrettierPlugin() {
    return tree => {
        visit(tree, ['code'], node => {
            if (node.lang === 'js' && !node.meta?.includes('skipPrettier')) {
                try {
                    node.value = prettier.format(node.value, {
                        semi: false,
                        printWidth: 60,
                        parser: 'typescript',
                    });
                } catch (e) {
                    console.warn('Example not parseable: ', node.value);
                }
            }
        });
    };
}

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readDirRecursive(dir) {
    const files: string[] = [];
    for (const fn of fs.readdirSync(dir)) {
        const p = path.resolve(dir, fn);
        if (fs.statSync(p).isDirectory()) {
            files.push(...readDirRecursive(p));
        } else {
            files.push(p);
        }
    }
    return files;
}

const examplesDir = path.resolve(__dirname, '../pages/examples/');
const exampleFiles = readDirRecursive(examplesDir).reduce((acc, fn) => {
    const relativePath = fn.replace(examplesDir, '').split('.')[0].replace(/^\//, '');
    const parts = relativePath.split('/');
    const exampleName = parts.pop();
    const key = parts.join('/');
    if (!acc[key]) {
        acc[key] = [];
    }
    let source = fs.readFileSync(fn).toString();
    const match = source.match(/^\/\*\*(.*)\n(( \*.*\n)*) \*\/((.*\n)*)/);
    let header = { title: exampleName, description: '', tags: {} };
    if (match) {
        const headerText = match[2].trim().replace(/^[ ]*\*/gm, '');
        const [title, ...body] = headerText.split('\n');
        let tags = {};
        const l = body.length - 1;
        for (let i = l; i >= 0; i--) {
            if (body[i].trim().startsWith('@')) {
                const line = body.pop() as string;
                const [tagName, ...value] = line.trim().split(' ').filter(Boolean);
                tags[tagName.slice(1)] = value.join(' ') || true;
            } else {
                break;
            }
        }
        header = { title, description: body.join('\n').trim(), tags };
        source = match[4];
    }
    acc[key].push({
        name: exampleName,
        url: '/examples/' + relativePath,
        header,
        code: {
            js: prettier.format(
                babel.transformSync(source, {
                    filename: fn.split('/').pop(),
                    babelrc: false,
                    configFile: false,
                    presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
                })?.code || '',
                { parser: 'babel' }
            ),
            ts: source,
        },
    });
    return acc;
}, {});
const pickedExamples: string[] = [];

async function compileMdx(code, docLinks) {
    try {
        return String(
            await compile(code.trim(), {
                remarkPlugins: [docLinks, formatWithPrettierPlugin],
                outputFormat: 'function-body',
                providerImportSource: '@mdx-js/react',
            })
        );
    } catch (e) {
        console.error('Failed to generate code', code, e);
        return undefined;
    }
}

async function extractChildren(
    node: JSONOutput.DeclarationReflection
): Promise<DeclarationReflection[]> {
    if (!node.sources) {
        // TODO: But why
        return [];
    }
    const docItem: DeclarationReflection = {
        ...(node as DeclarationReflection),
    };
    if (!node.children) {
        return [docItem];
    }
    const extractedChildren: DeclarationReflection[] = [docItem];
    for (const child of node.children) {
        if (child.kindString === 'Namespace') {
            // This is specifically for the typedoc-plugin-missing-exports plugin which adds internal types into
            // a namespace called <internal>
            child.sources = node.sources;
        }
        extractedChildren.push(...(await extractChildren(child)));
    }
    return extractedChildren;
}
async function traverse(obj, fn, visitedTracker = new Map(), path: any[] = []) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (visitedTracker.has(obj)) {
        return obj;
    }
    visitedTracker.set(obj, true);
    if (await fn(obj, path)) {
        return obj;
    }
    for (const value of Array.isArray(obj) ? obj : Object.values(obj)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                if (value && typeof value == 'object') {
                    await traverse(v, fn, visitedTracker, [...path, obj]);
                }
            }
        } else if (value && typeof value == 'object') {
            await traverse(value, fn, visitedTracker, [...path, obj]);
        }
    }
    return obj;
}

function orderBy<T>(items: T[], key: string): T[] {
    const copy = [...items];
    copy.sort((a, b) => {
        // if no key (eg. no name) then sort last
        if (!a[key]) {
            return 1;
        }
        if (!b[key]) {
            return -1;
        }
        return a[key].localeCompare(b[key]);
    });
    return copy;
}

function getDocUrl(declaration: JSONOutput.DeclarationReflection): string | false {
    if (declaration.name === 'ViewModelInterface' || declaration.name === 'ViewModelClassType') {
        return `/docs/viewmodel/viewModelFactory`;
    }
    if (declaration.name === 'PartialViewModel') {
        return `/docs/viewmodel/viewModelFactory`;
    }
    if (declaration.comment?.tags?.find(tag => tag.tag === 'extract-docs')) {
        const { fileName = '' } = declaration.sources?.[0] || {};
        if (!fileName) {
            console.warn(`Declaration ${declaration.name} has no sources, can't generate URL`);
            return false;
        }
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(1, -1), declaration.name].join('/');
        return `/docs/${slug}`;
    }
    return false;
}

type IntersectWithReference = {
    type: 'intersectWithReference';
    reference: JSONOutput.SomeType;
};

class Converter {
    references: Record<string, JSONOutput.DeclarationReflection>;
    docLinks: any;
    examples?: DocExample[];
    pathMap: Map<JSONOutput.DeclarationReflection, JSONOutput.DeclarationReflection[]>;

    constructor(
        references: Record<string, JSONOutput.DeclarationReflection>,
        docLinks,
        pathMap: Map<JSONOutput.DeclarationReflection, JSONOutput.DeclarationReflection[]>,
        examples?: DocExample[]
    ) {
        this.pathMap = pathMap;
        this.docLinks = docLinks;
        this.references = references;
        this.examples = examples;
    }

    resolvedChildren = new Map<
        Exclude<JSONOutput.DeclarationReflection['type'], undefined>,
        JSONOutput.DeclarationReflection[] | undefined
    >();
    resolveChildrenFromType(type: Exclude<JSONOutput.DeclarationReflection['type'], undefined>) {
        if (this.resolvedChildren.has(type)) {
            return this.resolvedChildren.get(type);
        }
        const children = this._resolveChildrenFromType(type);
        this.resolvedChildren.set(type, children);
        return children;
    }

    _resolveChildrenFromType(type: Exclude<JSONOutput.DeclarationReflection['type'], undefined>) {
        if (type.type === 'reference' && type.id && this.references[type.id]) {
            const docUrl = getDocUrl(this.references[type.id]);
            // Shortcut it... if we want to link to them don't expand children just say it intersects with them
            // later on where we handle intersectWithReference it will convert type to a referenceLink
            if (docUrl) {
                return [{ type: { type: 'intersectWithReference', reference: type } }];
            }
        }
        if (type.type === 'reference' && type.name === 'Omit' && type.typeArguments) {
            const children = this.resolveChildrenFromType(type.typeArguments[0]);
            if (children) {
                const omitTypes = type.typeArguments[1] as
                    | JSONOutput.LiteralType
                    | JSONOutput.UnionType;
                const omitKeys =
                    omitTypes.type === 'union'
                        ? omitTypes.types.map((t: JSONOutput.LiteralType) => t.value)
                        : [omitTypes.value];
                return orderBy(
                    children.filter(child => !omitKeys.includes(child.name)),
                    'name'
                );
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
        if (type.type === 'reference' && type.name === 'Pick' && type.typeArguments) {
            const children = this.resolveChildrenFromType(type.typeArguments[0]);
            if (children) {
                const pickTypes = type.typeArguments[1] as
                    | JSONOutput.LiteralType
                    | JSONOutput.UnionType;
                const pickKeys =
                    pickTypes.type === 'union'
                        ? pickTypes.types.map((t: JSONOutput.LiteralType) => t.value)
                        : [pickTypes.value];
                return orderBy(
                    children.filter(child => pickKeys.includes(child.name)),
                    'name'
                );
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
        if (type.type === 'reference' && type.id && this.references[type.id]) {
            return this.resolveChildren(this.references[type.id]);
        }
        if (type.type === 'reflection' && type.declaration) {
            return this.resolveChildren(type.declaration);
        }
        if (type.type === 'intersection') {
            return orderBy(
                type.types
                    .map(t => this.resolveChildrenFromType(t))
                    .reduce(
                        (
                            acc: (DeclarationReflection | { type: IntersectWithReference })[],
                            children: DeclarationReflection[] | undefined,
                            i
                        ) => {
                            if (!children) {
                                let t = type.types[i];
                                // @ts-ignore
                                if (t.name === 'Omit') {
                                    // Instead of showing 'Any properties from Omit' show the type
                                    // omit was from. This will be very fragile.
                                    // @ts-ignore
                                    t = t.typeArguments[0];
                                }
                                acc.push({
                                    type: { type: 'intersectWithReference', reference: t },
                                });
                                return acc;
                            }
                            const names = children.map(child => child.name);
                            acc = acc.filter(item =>
                                'name' in item ? !names.includes(item.name) : true
                            );
                            acc.push(...children);
                            return acc;
                        },
                        []
                    ),
                'name'
            );
        }
        if (type.type === 'reference' && type.name === 'Partial' && type.typeArguments) {
            const children = this.resolveChildrenFromType(type.typeArguments[0]);
            if (children) {
                return children.map(child => ({
                    ...child,
                    flags: { ...child.flags, isOptional: true },
                }));
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
    }

    resolveChildren(
        declaration: JSONOutput.DeclarationReflection
    ):
        | (JSONOutput.DeclarationReflection | { indexSignature: JSONOutput.SignatureReflection })[]
        | undefined {
        let children;
        if (declaration.children) {
            children = orderBy(declaration.children, 'name');
        } else {
            const { type } = declaration;
            if (type) {
                return this.resolveChildrenFromType(type);
            }
        }
        if (declaration.indexSignature) {
            if (!children) {
                children = [];
            }
            children.push({ indexSignature: declaration.indexSignature });
        }
        return children;
    }

    shouldExpand(param: JSONOutput.DeclarationReflection) {
        if (
            param.name === '__namedParameters' ||
            (param.type?.type == 'reflection' && param.type.declaration)
        ) {
            return true;
        }
        if (param.comment?.tags?.find(tag => tag.tag === 'expand-properties')) {
            return true;
        }
        if (
            param.type?.type === 'reference' &&
            param.type.id &&
            this.references[param.type.id] &&
            this.shouldExpand(this.references[param.type.id])
        ) {
            return true;
        }
        return false;
    }

    resolvedTypeParameters = new Map<Exclude<string, undefined>, TypeParameter[]>();

    async convertTypeParameter(
        typeParameters: JSONOutput.DeclarationReflection['typeParameter']
    ): Promise<TypeParameter[] | undefined> {
        if (typeParameters) {
            const key = typeParameters.map(t => t.id).join('.');
            const n = this.resolvedTypeParameters.get(key);
            if (n) {
                return n;
            }
            const node = await this._convertTypeParameter(typeParameters);
            this.resolvedTypeParameters.set(key, node);
            return node;
        }
        return undefined;
    }

    async _convertTypeParameter(
        typeParameters: Exclude<JSONOutput.DeclarationReflection['typeParameter'], undefined>
    ): Promise<TypeParameter[]> {
        return Promise.all(
            typeParameters.map(async t => {
                return {
                    name: t.name,
                    type: t.type ? await this.convertType(t.type) : undefined,
                    default: t.default ? await this.convertType(t.default) : undefined,
                    description: await this.convertComment(t.comment),
                };
            })
        );
    }

    async convertFunction(docItem: JSONOutput.DeclarationReflection): Promise<FunctionPage> {
        return {
            pageType: 'function',
            name: docItem.name,
            signatures: await this.convertSignatures(docItem.signatures || []),
            description: await this.convertComment(docItem.comment),
            sourceLocation: this.convertSourceLocation(docItem),
            typeParameters: await this.convertTypeParameter(docItem.typeParameter),
        };
    }

    currentTypeParameter: (JSONOutput.TypeParameterReflection & {
        resolved?: JSONOutput.SomeType;
    })[][] = [];
    async withTypeParameter<T extends (...args: any) => any>(
        typeParameter: JSONOutput.DeclarationReflection['typeParameter'],
        cb: T
    ): Promise<ReturnType<T>> {
        if (typeParameter) {
            this.currentTypeParameter.push(typeParameter);
        }
        const cleanup = () => {
            const index = this.currentTypeParameter.findIndex(t => t === typeParameter);
            if (index !== -1) {
                this.currentTypeParameter.splice(index, 1);
            }
        };
        try {
            const r = await cb();
            cleanup();
            return r;
        } catch (e) {
            cleanup();
            throw e;
        }
    }

    docItem: JSONOutput.DeclarationReflection;
    async convert(docItem: JSONOutput.DeclarationReflection): Promise<Page | undefined> {
        this.docItem = docItem;
        return this.withTypeParameter(docItem.typeParameter, async () => {
            if (docItem.kindString === 'Function') {
                return await this.convertFunction(docItem);
            }
            if (docItem.kindString === 'Class' || docItem.kindString === 'Interface') {
                return await this.convertClass(docItem);
            }
            console.log('Failed to find', docItem.kindString);
        });
    }

    async createNode(
        declaration: JSONOutput.DeclarationReflection,
        anchorPrefix: string
    ): Promise<DocNode> {
        return {
            anchorId: this.generateAnchorId(declaration, anchorPrefix),
            flags: await this.convertFlags(declaration),
            name: declaration.name,
            description: await this.convertComment(declaration.comment),
            sourceLocation: this.convertSourceLocation(declaration),
        };
    }

    resolvedNodes = new Map<
        | JSONOutput.SomeType
        | JSONOutput.MappedType
        | JSONOutput.TemplateLiteralType
        | JSONOutput.NamedTupleMemberType
        | IntersectWithReference,
        DocType
    >();

    async convertType(
        type:
            | JSONOutput.SomeType
            | JSONOutput.MappedType
            | JSONOutput.TemplateLiteralType
            | JSONOutput.NamedTupleMemberType
            | IntersectWithReference
            | undefined,
        sourceDeclaration?: JSONOutput.DeclarationReflection,
        options?: { isReturnType?: boolean }
    ): Promise<DocType> {
        // @ts-ignore
        if (!type) {
            throw new Error('Expected a type');
        }
        const n = this.resolvedNodes.get(type);
        if (n) {
            return n;
        }
        const node = await this._convertType(type, sourceDeclaration, options);
        this.resolvedNodes.set(type, node);
        return node;
    }

    async _convertType(
        type:
            | JSONOutput.SomeType
            | JSONOutput.MappedType
            | JSONOutput.TemplateLiteralType
            | JSONOutput.NamedTupleMemberType
            | IntersectWithReference,
        sourceDeclaration?: JSONOutput.DeclarationReflection,

        { isReturnType = false }: { isReturnType?: boolean } = {}
    ): Promise<DocType> {
        if (sourceDeclaration) {
            const tag = getTagByName(
                sourceDeclaration,
                isReturnType ? 'return-type-name' : 'type-name'
            );
            if (tag) {
                return {
                    typeName: 'unknown',
                    name: tag.text.trim(),
                };
            }
        }
        if (type.type === 'intersectWithReference') {
            return {
                typeName: 'propertiesFrom',
                type: await this.convertType(type.reference, sourceDeclaration),
            };
        }
        if (type.type === 'array') {
            return {
                typeName: 'array',
                elementType: await this.convertType(type.elementType),
            };
        }
        if (type.type === 'reference') {
            return this.convertReference(type);
        }
        if (type.type === 'reflection') {
            const { declaration } = type;
            if (declaration?.children) {
                const children = this.resolveChildren(declaration);
                if (children) {
                    return this.withTypeParameter(declaration.typeParameter, () =>
                        this.createContainerType(children, declaration)
                    );
                }
            }
            if (type.declaration) {
                if (
                    type.declaration.kindString === 'Method' ||
                    (type.declaration.kindString === 'Type literal' && type.declaration.signatures)
                ) {
                    return this.createMethodType(type.declaration);
                }
                return {
                    typeName: 'unknown',
                    name: this.resolveName(type.declaration),
                };
            }
        }
        if (type.type === 'intersection') {
            const children: JSONOutput.DeclarationReflection[] = this.resolveChildrenFromType(type);
            return this.createContainerType(children, sourceDeclaration);
        }
        if (type.type === 'literal') {
            return {
                typeName: 'literal',
                value: type.value,
            };
        }
        if (type.type === 'union') {
            return {
                typeName: 'union',
                types: await Promise.all(type.types.map(t => this.convertType(t))),
            };
        }
        if (type.type === 'intrinsic') {
            return {
                typeName: 'intrinsic',
                name: type.name,
            };
        }
        if (type.type === 'tuple') {
            return {
                typeName: 'tuple',
                elements: await Promise.all((type.elements || []).map(e => this.convertType(e))),
            };
        }
        if (type.type === 'mapped') {
            return {
                typeName: 'mapped',
            };
        }
        if (type.type === 'conditional') {
            return {
                typeName: 'union',
                types: await Promise.all(
                    [type.trueType, type.falseType].map(t => this.convertType(t))
                ),
            };
        }
        if (type.type === 'indexedAccess') {
            return {
                typeName: 'indexedAccess',
                indexType: await this.convertType(type.indexType),
                objectType: await this.convertType(type.objectType),
            };
        }
        if (type.type === 'predicate') {
            return {
                typeName: 'predicate',
            };
        }
        console.log('Unknown type', type);
        return {
            typeName: 'unknown',
            name: type.type,
        };
    }

    async convertFlags(declaration: JSONOutput.DeclarationReflection) {
        const { comment } = declaration;
        const flags: Flags = {};
        if (declaration.flags?.isOptional || 'defaultValue' in declaration) {
            flags.isOptional = true;
        }
        if (!!declaration.flags?.isRest) {
            flags.isRestArg = true;
        }
        if (comment?.tags) {
            for (const tag of comment.tags) {
                const text = tag.text.trim();
                if (tag.tag === 'deprecated') {
                    flags.isDeprecated = true;
                    if (text) {
                        flags.deprecatedReason = await compileMdx(text, this.docLinks);
                    }
                }
                if (tag.tag === 'expand-properties') {
                    flags.expandProperties = true;
                }
                if (tag.tag === 'forward-ref') {
                    flags.isForwardRef = true;
                }
            }
        }

        return flags;
    }

    async convertSignatures(signatures: JSONOutput.SignatureReflection[]): Promise<Signature[]> {
        const transformed: Signature[] = [];
        for (const signature of signatures) {
            transformed.push(
                await this.withTypeParameter(signature.typeParameter, () =>
                    this.convertSignature(signature)
                )
            );
        }
        return transformed;
    }

    fixUnnamedFunction<T extends DocType>(type: T, dec: JSONOutput.DeclarationReflection): T {
        // This is where parameter like:
        // isEquals: (a, b) => boolean
        // The function def will get __type as the name so when we render it
        // in modal it looks bad. Render is as isEquals instead
        if (type.typeName === 'methodType' && type.name === '__type') {
            const path = this.pathMap.get(dec);
            if (path) {
                for (let i = path.length - 1; i >= 0; i--) {
                    if (path[i].name && path[i].name !== type.name) {
                        type.name = path[i].name;
                        break;
                    }
                }
                type.signatures.forEach(sig => {
                    if (sig.name === '__type') {
                        sig.name = type.name;
                        sig.anchorId = sig.anchorId.replace('__type', type.name);
                    }
                });
            }
        } else if (type.typeName === 'union') {
            type.types.forEach(t => this.fixUnnamedFunction(t, dec));
        }
        return type;
    }

    async convertSignature(signature: JSONOutput.SignatureReflection): Promise<Signature> {
        return {
            ...(await this.createNode(signature, 'Method')),
            parameters: await Promise.all(
                (signature.parameters || []).map(async param => {
                    const resolvedType = this.resolveReferencedType(param);
                    const typeArgs = this._resolveTypeArguments(resolvedType);
                    if (param.type?.type === 'reference' && param.type.typeArguments) {
                        typeArgs.push(...this._resolveTypeArgumentsFromType(param.type));
                    }
                    const type = await this.withTypeParameter(typeArgs, () =>
                        this.convertType(param.type, param)
                    );
                    const name = param.name === '__namedParameters' ? 'props' : param.name;
                    return {
                        name,
                        type: this.fixUnnamedFunction(type, param),
                        description: await this.convertComment({
                            ...resolvedType.comment,
                            ...param.comment,
                        }),
                        flags: {
                            ...(await this.convertFlags(resolvedType)),
                            ...(await this.convertFlags(param)),
                        },
                    };
                })
            ),
            typeParameters: await this.convertTypeParameter(signature.typeParameter),
            returnType: await this.convertType(signature.type, signature, { isReturnType: true }),
            sourceLocation: this.convertSourceLocation(signature),
            isInherited: !!signature.inheritedFrom,
        };
    }

    anchorIds = new Set<string>();

    private generateAnchorId(
        declaration: JSONOutput.DeclarationReflection,
        sectionName = 'default'
    ): string {
        let anchorId = `${sectionName.split(' ').join(' ')}-${declaration.name
            .split(' ')
            .join('-')}`;
        let i = 1;
        let nextAnchorId = anchorId;
        while (this.anchorIds.has(nextAnchorId)) {
            nextAnchorId = `${anchorId}-${i}`;
            i++;
        }
        this.anchorIds.add(nextAnchorId);
        return anchorId;
    }

    async convertComment(comment: JSONOutput.Reflection['comment']) {
        const description: RichDescription = {};
        if (comment?.text) {
            description.long = await compileMdx(comment?.text, this.docLinks);
        }
        if (comment?.shortText) {
            description.short = await compileMdx(comment?.shortText, this.docLinks);
        }
        if (comment?.returns) {
            description.returns = await compileMdx(comment?.returns, this.docLinks);
        }
        if (Object.keys(description).length === 0) {
            return undefined;
        }
        return description;
    }

    async createIndexSignatureType(
        indexSignature: JSONOutput.SignatureReflection
    ): Promise<IndexSignatureType> {
        return {
            typeName: 'indexSignature',
            description: await this.convertComment(indexSignature.comment),
            parameters: [],
            type: await this.convertType(indexSignature.type, indexSignature),
        };
    }

    resolvedContainers = new Map<
        (JSONOutput.DeclarationReflection | { indexSignature: JSONOutput.SignatureReflection })[],
        ContainerType
    >();
    async createContainerType(
        children: (
            | JSONOutput.DeclarationReflection
            | { indexSignature: JSONOutput.SignatureReflection }
        )[],
        source?: JSONOutput.DeclarationReflection
    ): Promise<ContainerType> {
        const resolved = this.resolvedContainers.get(children);
        if (resolved) {
            return resolved;
        }
        const obj: ContainerType = {
            typeName: 'container',
            name: source ? this.resolveName(source) : undefined,
            children: [],
        };
        let indexSignature = source?.indexSignature;
        if (!indexSignature) {
            indexSignature = children.find(child => child.indexSignature)?.indexSignature;
        }
        if (indexSignature) {
            obj.indexSignature = await this.createIndexSignatureType(indexSignature);
        }
        const realChildren = children.filter(
            child => !child.indexSignature
        ) as JSONOutput.DeclarationReflection[];
        this.resolvedContainers.set(children, obj);
        obj.children = await Promise.all(
            realChildren.map(async child => {
                return this.withTypeParameter(child.typeParameter, async () => {
                    let { comment } = child;
                    const originalChild = child;
                    let childType: DocType | null = null;
                    if (
                        child.type?.type === 'reference' &&
                        child.type.id &&
                        this.references[child.type.id]
                    ) {
                        child = this.references[child.type.id];
                    }
                    if (!comment) {
                        comment = child.comment;
                    }
                    return this.withTypeParameter(child.typeParameter, async () => {
                        if (
                            child.kindString === 'Method' ||
                            (child.kindString === 'Interface' && child.signatures)
                        ) {
                            if (!comment && child.signatures) {
                                comment = child.signatures[0]?.comment;
                            }
                            childType = await this.createMethodType(child);
                        } else {
                            const tag = getTagByName(originalChild, 'type-name');
                            if (tag) {
                                childType = {
                                    typeName: 'unknown',
                                    name: tag.text.trim(),
                                };
                            } else if (!child.type) {
                                const url = getDocUrl(child);
                                if (url) {
                                    childType = {
                                        typeName: 'referenceLink',
                                        name: child.name,
                                        url,
                                    };
                                } else {
                                    childType = { typeName: 'unknown', name: child.name };
                                }
                            } else {
                                childType = await this.convertType(child.type, originalChild);
                            }
                        }
                        return {
                            name: originalChild.name,
                            flags: await this.convertFlags(originalChild),
                            type: this.fixUnnamedFunction(childType, originalChild),
                            description: await this.convertComment(comment || child.comment),
                        };
                    });
                });
            })
        );
        return obj;
    }

    async createMethodType(child: JSONOutput.DeclarationReflection): Promise<MethodType> {
        return this.fixUnnamedFunction(
            {
                name: child.name,
                typeName: 'methodType',
                signatures: await this.convertSignatures(child.signatures || []),
            },
            child
        );
    }

    private resolveReferencedType(declaration: JSONOutput.DeclarationReflection) {
        if (
            declaration.type?.type === 'reference' &&
            declaration.type.id &&
            this.references[declaration.type.id]
        ) {
            return this.references[declaration.type.id];
        }
        return declaration;
    }

    private matchCurrentTypeParameter(
        id: number | undefined
    ): (JSONOutput.TypeParameterReflection & { resolved?: JSONOutput.SomeType }) | null {
        if (!id) {
            return null;
        }
        let match:
            | (JSONOutput.TypeParameterReflection & { resolved?: JSONOutput.SomeType })
            | null = null;
        let matchIndex = -1;
        for (let i = this.currentTypeParameter.length - 1; i >= 0; i--) {
            const params = this.currentTypeParameter[i];
            const param = params.find(param => param.id === id);
            if (param) {
                if (!match || param.resolved) {
                    match = param;
                    matchIndex = i;
                }
                if (param.resolved) {
                    break;
                }
            }
        }
        if (match && match.comment?.shortText?.trim() === '@inherit') {
            for (let i = matchIndex - 1; i >= 0; i--) {
                const params = this.currentTypeParameter[i];
                const param = params.find(param => param.name === match?.name);
                if (
                    param &&
                    param.comment?.shortText &&
                    param.comment?.shortText?.trim() !== '@inherit'
                ) {
                    return {
                        ...match,
                        comment: param.comment,
                    };
                }
            }
            console.log(
                match,
                'said to inherit type param doc but could not find anything to inherit'
            );
        }
        return match;
    }

    externalReferences = {
        RequestInit: 'https://developer.mozilla.org/en-US/docs/Web/API/fetch#init',
        Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
        Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
        'Intl.DateTimeFormatOptions':
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters',
    };

    private convertExternalReference(
        type: JSONOutput.ReferenceType
    ): UnknownType | ExternalReferenceType {
        if (type.name in this.externalReferences) {
            return {
                typeName: 'externalReference',
                name: type.name,
                url: this.externalReferences[type.name],
            };
        }
        return {
            typeName: 'unknown',
            name: type.name,
        };
    }

    /**
     * Extract any links from the generated MDX
     */
    extractInPageLinks(
        declaration: JSONOutput.DeclarationReflection,
        description?: RichDescription
    ): PageSection[] {
        const inPageLinks: PageSection[] = [];
        if (description && declaration.comment) {
            let section: null | PageSection = null;
            for (const [descAttr, commentAttr] of [
                ['short', 'shortText'],
                ['long', 'text'],
            ]) {
                const value = declaration.comment[commentAttr];
                if (value && description[descAttr]) {
                    const matches = value
                        .split('\n')
                        .map(line => line.match(/^(#+) (.*)$/))
                        .filter(Boolean);
                    if (matches.length > 0) {
                        for (const [, hashes, title] of matches) {
                            const heading = `h${hashes.length}`;
                            if (heading !== 'h2' && heading !== 'h3') {
                                throw new Error(`Dunno how to handle ${heading} - update logic`);
                            }
                            if (heading === 'h2') {
                                if (section) {
                                    inPageLinks.push(section);
                                }
                                section = {
                                    title,
                                    showEmpty: true,
                                    anchorId: title.split(' ').join('-'),
                                    links: [],
                                };
                            }
                            if (heading === 'h3') {
                                if (!section) {
                                    section = {
                                        anchorId:
                                            inPageLinks.length === 0
                                                ? 'main-content'
                                                : title.split(' ').join('-'),
                                        title: declaration.name,
                                        showEmpty: true,
                                        links: [],
                                    };
                                }
                                section.links.push({
                                    title: title,
                                    anchorId: title.split(' ').join('-'),
                                });
                            }
                        }
                    }
                }
            }
            if (section) {
                inPageLinks.push(section);
            }
        }
        if (this.examples) {
            inPageLinks.push({
                title: 'Examples',
                showEmpty: true,
                anchorId: 'examples',
                links: [],
            });
        }
        return inPageLinks;
    }

    private async convertClass(docItem: JSONOutput.DeclarationReflection): Promise<ClassPage> {
        return this.withTypeParameter(this._resolveTypeArguments(docItem), async () => {
            function getMethod(
                method: JSONOutput.DeclarationReflection
            ): false | JSONOutput.DeclarationReflection {
                if (method.kindString === 'Method') {
                    return method;
                }
                // See Paginator.setInternalState for example of this - it's assigned in constructor:
                // this.setInternalState = () => {...}
                if (
                    method.kindString === 'Property' &&
                    method.type?.type === 'reflection' &&
                    method.type.declaration?.signatures
                ) {
                    return method.type.declaration;
                }
                return false;
            }
            function getMethods(
                methods: JSONOutput.DeclarationReflection[],
                isStatic: boolean
            ): JSONOutput.DeclarationReflection[] {
                return methods
                    .map(getMethod)
                    .filter(
                        m => m && !!m.flags?.isStatic === isStatic
                    ) as JSONOutput.DeclarationReflection[];
            }

            function getProperties(
                properties: JSONOutput.DeclarationReflection[],
                isStatic: boolean
            ): JSONOutput.DeclarationReflection[] {
                return orderBy(
                    properties.filter(
                        m =>
                            !getMethod(m) &&
                            ['Property', 'Accessor'].includes(m.kindString || '') &&
                            !!m.flags?.isStatic === isStatic
                    ),
                    'name'
                );
            }

            const children = docItem.children?.filter(child => !child.flags?.isPrivate) || [];

            const methods = orderBy(
                await Promise.all(getMethods(children, false).map(m => this.convertClassMethod(m))),
                'name'
            );
            const staticMethods = orderBy(
                await Promise.all(
                    getMethods(children || [], true).map(m => this.convertClassMethod(m))
                ),
                'name'
            );
            const properties = orderBy(
                await Promise.all(
                    getProperties(children, false).map(m => this.convertClassProperty(m))
                ),
                'name'
            );
            const staticProperties = orderBy(
                await Promise.all(
                    getProperties(children, true).map(m => this.convertClassProperty(m))
                ),
                'name'
            );

            const description = await this.convertComment(docItem.comment);

            const pageSections: PageSection[] = [
                {
                    title: 'Methods',
                    anchorId: 'Methods',
                    links: methods.map(method => ({
                        title: method.name,
                        anchorId: method.signatures[0].anchorId,
                        isInherited: method.signatures[0].isInherited,
                    })),
                },
                {
                    title: 'Properties',
                    anchorId: 'Properties',
                    links: properties.map(prop => ({
                        title: prop.name,
                        anchorId: prop.anchorId,
                        isInherited: prop.isInherited,
                    })),
                },
                {
                    title: 'Static Methods',
                    anchorId: 'Static-Methods',
                    links: staticMethods.map(method => ({
                        title: method.name,
                        anchorId: method.signatures[0].anchorId,
                        isInherited: method.signatures[0].isInherited,
                    })),
                },
                {
                    title: 'Static Properties',
                    anchorId: 'Static-Properties',
                    links: staticProperties.map(prop => ({
                        title: prop.name,
                        anchorId: prop.anchorId,
                        isInherited: prop.isInherited,
                    })),
                },
            ].filter(section => section.links.length > 0);
            pageSections.unshift(...(this.extractInPageLinks(docItem, description) || []));

            let hierarchy: {
                parent: UnknownType | ReferenceLinkType | ExternalReferenceType | null;
                typeArguments?: DocType[];
                children: (ReferenceLinkType | ExternalReferenceType)[];
            } = {
                parent: null,
                children: [],
            };
            if (docItem.extendedTypes?.length) {
                const extendedType = docItem.extendedTypes[0];
                if (extendedType.type === 'reference') {
                    const referencedType = extendedType.id
                        ? this.references[extendedType.id]
                        : null;
                    if (referencedType) {
                        const url = getDocUrl(referencedType);
                        if (url) {
                            hierarchy.parent = {
                                typeName: 'referenceLink',
                                name: referencedType.name,
                                url,
                            } as ReferenceLinkType;
                        } else {
                            console.error('Could not find URL for ', referencedType.name);
                        }
                    } else {
                        hierarchy.parent = this.convertExternalReference(extendedType);
                    }
                    if (extendedType.typeArguments) {
                        hierarchy.typeArguments = await Promise.all(
                            extendedType.typeArguments.map(typeArg => this.convertType(typeArg))
                        );
                    }
                } else {
                    console.error('Extended type is not a reference', extendedType);
                }
            }
            if (docItem.extendedBy?.length) {
                for (const item of docItem.extendedBy) {
                    // @ts-ignore
                    const referencedType = this.references[item?.id];
                    if (referencedType) {
                        const url = getDocUrl(referencedType);
                        if (url) {
                            hierarchy.children.push({
                                typeName: 'referenceLink',
                                name: referencedType.name,
                                url,
                            } as ReferenceLinkType);
                        } else {
                            console.error(
                                'Could not find URL for extendedBy type ',
                                referencedType.name
                            );
                        }
                    } else {
                        console.error('Expected only reference types', item);
                    }
                }
            }

            return this.withTypeParameter(
                docItem.typeParameter,
                async () =>
                    ({
                        pageType: 'class',
                        pageSections,
                        hierarchy,
                        sourceLocation: this.convertSourceLocation(docItem),
                        name: docItem.name,
                        description,
                        constructorDefinition: await this.convertConstructor(docItem),
                        methods,
                        properties,
                        staticMethods,
                        staticProperties,
                        typeParameters: await this.convertTypeParameter(docItem.typeParameter),
                    } as ClassPage)
            );
        });
    }

    _resolveTypeArgumentsFromType(type: JSONOutput.SomeType) {
        if (type.type === 'reference') {
            const referencedType = type.id ? this.references[type.id] : null;
            if (referencedType) {
                const typeArgs = (type.typeArguments ? type.typeArguments : []).map((arg, i) => ({
                    ...referencedType.typeParameter?.[i],
                    resolved: arg,
                }));
                return [...typeArgs, ...this._resolveTypeArguments(referencedType)];
            }
        }
        return [];
    }

    _resolveTypeArguments(declaration: JSONOutput.DeclarationReflection) {
        if (declaration.extendedTypes?.length === 1) {
            const extendedType = declaration.extendedTypes[0];
            return this._resolveTypeArgumentsFromType(extendedType);
        }
        if (declaration.type?.type === 'intersection') {
            return declaration.type.types
                .map(t => this._resolveTypeArgumentsFromType(t))
                .reduce((acc, t) => {
                    acc.push(...t);
                    return acc;
                }, []);
        }
        return [];
    }

    private async convertConstructor(
        declaration: JSONOutput.DeclarationReflection
    ): Promise<ClassConstructor | undefined> {
        const constructor = declaration.children?.find(child => child.kindString === 'Constructor');
        if (!constructor) {
            return undefined;
        }
        const resolve = async () => ({
            signatures: await this.convertSignatures(constructor.signatures || []),
        });
        const resolvedTypeArgs = this._resolveTypeArguments(declaration);
        if (resolvedTypeArgs.length > 0) {
            return this.withTypeParameter(resolvedTypeArgs, resolve);
        }
        return resolve();
    }

    private async convertClassMethod(m: JSONOutput.DeclarationReflection) {
        return this.fixUnnamedFunction(
            {
                typeName: 'methodType',
                name: m.name,
                signatures: await this.convertSignatures(m.signatures || []),
            },
            m
        );
    }

    resolvedReferenceTypes = new Map<number, DocType>();
    private async convertReference(type: JSONOutput.ReferenceType): Promise<DocType> {
        if (type.id) {
            const resolved = this.resolvedReferenceTypes.get(type.id);
            if (resolved) {
                return resolved;
            }
            const t = await this._convertReference(type);
            this.resolvedReferenceTypes.set(type.id, t);
            return t;
        }
        return this._convertReference(type);
    }

    private async _convertReference(type: JSONOutput.ReferenceType): Promise<DocType> {
        if (type.id && this.references[type.id]) {
            const referencedType = this.references[type.id];
            return this.withTypeParameter(
                [
                    ...this._resolveTypeArgumentsFromType(type),
                    ...(referencedType.typeParameter || []),
                ],
                async () => {
                    const url = getDocUrl(referencedType);
                    if (url) {
                        return {
                            typeName: 'referenceLink',
                            name: referencedType.name,
                            url,
                        } as ReferenceLinkType;
                    } else if (this.shouldExpand(referencedType)) {
                        const children = this.resolveChildren(referencedType);
                        if (children) {
                            return this.createContainerType(children, referencedType);
                        }
                    }
                    if (!referencedType.type) {
                        if (referencedType.kindString === 'Interface') {
                            return this.convertInterface(referencedType);
                        }
                        return {
                            typeName: 'unknown',
                            name: referencedType.kindString,
                        } as UnknownType;
                    }
                    return this.convertType(referencedType.type, referencedType);
                }
            );
        } else if (this.currentTypeParameter && type.id) {
            const match = this.matchCurrentTypeParameter(type.id);
            if (match) {
                if (match.resolved) {
                    return this.convertType(match.resolved);
                }
                return {
                    // TODO: probably need more info here
                    typeName: 'typeArgument',
                    name: type.name,
                    id: type.id,
                    description: await this.convertComment(match.comment),
                };
            } else {
                let match;
                for (let i = this.currentTypeParameter.length - 1; i >= 0; i--) {
                    const params = this.currentTypeParameter[i];
                    const param = params.find(param => param.name === type.name);
                    if (param) {
                        if (!match || param.resolved) {
                            match = param;
                        }
                        if (param.resolved) {
                            break;
                        }
                    }
                }
                if (match) {
                    if (match.resolved && match.resolved !== type) {
                        return this.convertType(match.resolved);
                    }
                    return {
                        typeName: 'typeArgument',
                        name: type.name,
                        id: type.id,
                        description: await this.convertComment(match.comment),
                    };
                }
                // console.log('TODO', type, this.currentTypeParameter);
            }
            // if (this.currentTypeParameter) console.log('TODO', type, this.currentTypeParameter);
        }

        if (type.package === 'typescript') {
            return this.convertExternalReference(type);
        }
        return {
            typeName: 'unknown',
            name: type.name,
        };
    }

    private async convertClassProperty(
        property: JSONOutput.DeclarationReflection
    ): Promise<VariableNode> {
        let type = property.type;
        if (!type && property.getSignature) {
            type = property.getSignature[0]?.type;
        }
        return {
            ...(await this.createNode(property, 'Property')),
            type: await this.convertType(type, property),
            isInherited: !!property.inheritedFrom,
        };
    }

    private convertSourceLocation(item: JSONOutput.DeclarationReflection) {
        if (item.sources && item.sources.length > 0) {
            return {
                fileName: item.sources[0].fileName,
                line: item.sources[0].line,
            };
        }
        return undefined;
    }

    private resolveName(declaration: JSONOutput.DeclarationReflection | undefined) {
        if (!declaration) {
            return '<unknown>';
        }
        let name = declaration.name;
        if (name === '__type' && declaration) {
            const path = this.pathMap.get(declaration);
            if (path) {
                for (let i = path.length - 1; i >= 0; i--) {
                    if (path[i].name && path[i].name !== name) {
                        name = path[i].name;
                        break;
                    }
                }
            }
        }
        if (name === '__namedParameters') {
            name = 'Object';
        }
        return name;
    }

    private async convertInterface(referencedType: DeclarationReflection) {
        if (referencedType.kindString === 'Interface' && referencedType.signatures) {
            return this.createMethodType(referencedType);
        }
        return {
            typeName: 'interface',
            classPage: await this.convertClass(referencedType),
        } as InterfaceType;
    }
}

function getMenuGroup(docItem: DeclarationReflection) {
    return getTagByName(docItem, 'menu-group')?.text.trim() || 'default';
}

async function main() {
    const repoRoot = path.resolve(__dirname, '../../');
    const packagesRoot = path.resolve(repoRoot, 'js-packages/@prestojs/');

    for (const pkg of ['util', 'viewmodel', 'ui', 'final-form', 'ui-antd', 'routing', 'rest']) {
        const app = new TypeDoc.Application();

        app.options.addReader(new TypeDoc.TSConfigReader());
        const entryPoints = getTsFiles(path.join(packagesRoot, pkg, 'src/'));
        app.bootstrap({
            entryPoints,
            tsconfig: path.join(packagesRoot, pkg, 'tsconfig.json'),
            plugin: [
                path.resolve(__dirname, '../plugins/forceExport.js'),
                'typedoc-plugin-rename-defaults',
                path.resolve(__dirname, '../plugins/fixSource.js'),
            ],
            // @ts-ignore
            'presto-root': repoRoot,
            'presto-package-root': path.join(packagesRoot, pkg),
        });

        const project = app.convert();
        if (!project) {
            throw new Error(`convert failed for ${pkg}`);
        }
        const tmpFile = `./___temp_${pkg}.json`;
        await app.generateJson(project, tmpFile);
        // await app.generateDocs(project, './out');
    }

    const children: JSONOutput.DeclarationReflection[] = [
        ...require('./___temp_util.json').children,
        ...require('./___temp_viewmodel.json').children,
        ...require('./___temp_ui.json').children,
        ...require('./___temp_ui-antd.json').children,
        ...require('./___temp_routing.json').children,
        ...require('./___temp_rest.json').children,
        ...require('./___temp_final-form.json').children,
    ];
    // @ts-ignore
    const declarations: DeclarationReflection[] = [];
    for (const child of children) {
        declarations.push(...(await extractChildren(child)));
    }
    const docsPath = path.resolve(__dirname, '../data/');

    const byId = {};
    const byName = {};
    const menuByName: Record<string, any> = {};
    for (const docItem of declarations) {
        byId[docItem.id] = docItem;
        byName[docItem.name] = docItem;
    }
    const docLinks = makeDocLinksPlugin(byName);
    const visitedTracker = new Map();
    for (const docItem of declarations) {
        let comment = docItem.comment;
        if (
            docItem.kindString === 'Function' &&
            docItem.signatures &&
            docItem.signatures.length > 0
        ) {
            comment = docItem.signatures[0].comment;
        }
        if (!comment?.tags?.find(tag => tag.tag === 'extract-docs')) {
            continue;
        }

        const references = {};
        const pathMap = new Map<
            JSONOutput.DeclarationReflection,
            JSONOutput.DeclarationReflection[]
        >();
        const defaultNameMapping = {
            urlPattern: 'UrlPattern',
            field: 'Field',
        };
        const fn = async (obj, path) => {
            pathMap.set(obj, path);
            if (obj.type === 'reference' && !obj.id) {
                if (obj.name === 'default') {
                    const parent = path[path.length - 1];
                    if (parent && defaultNameMapping[parent.name]) {
                        obj.name = defaultNameMapping[parent.name];
                    }
                }
                if (byName[obj.name]) {
                    if (obj.name !== 'default') {
                        obj.id = byName[obj.name].id;
                    } else {
                        console.log(
                            "Reference had name of 'default' and so couldn't be resolved",
                            obj,
                            path[path.length - 1]
                        );
                    }
                }
            }
            if (obj.name === '__type' && path.length) {
                // This is where parameter like:
                // isEquals: (a, b) => boolean
                // The function def will get __type as the name so when we render it
                // in modal it looks bad. Render is as isEquals instead
                for (let i = path.length - 1; i >= 0; i--) {
                    if (path[i].name && path[i].name !== obj.name) {
                        // obj.name = path[i].name;
                        break;
                    }
                }
            }
            if (obj.type === 'reference' && byId[obj.id]) {
                references[obj.id] = await traverse(byId[obj.id], fn, visitedTracker);
            }
        };
        await traverse(docItem, fn, visitedTracker);
        const referenceVisitedTracker = new Map();
        await traverse(
            docItem,
            async (obj, path) => {
                pathMap.set(obj, path);
                if (obj.type === 'reference' && byId[obj.id]) {
                    references[obj.id] = await traverse(byId[obj.id], fn, referenceVisitedTracker);
                }
            },
            referenceVisitedTracker
        );

        const menuGroup = getMenuGroup(docItem);
        const { fileName = '' } = docItem.sources?.[0] || {};
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(1, -1), docItem.name].join('/');
        const [packageName] = slug.split('/');
        const packageDir = `${docsPath}/${packageName}`;
        const outPath = path.resolve(packageDir, `${slug.split('/').slice(1).join('/')}.json`);
        const exampleKey = importPath.replace('@prestojs/', '');
        const examples: undefined | DocExample[] = exampleFiles[exampleKey];
        if (examples) {
            await Promise.all(
                examples.map(async example => {
                    if (example.header.description) {
                        example.header.description = await compileMdx(
                            example.header.description,
                            docLinks
                        );
                    }
                })
            );
            pickedExamples.push(exampleKey);
        }

        if (!fs.existsSync(path.dirname(outPath))) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
        }
        const converter = new Converter({ ...byId, ...references }, docLinks, pathMap, examples);
        const page = await converter.convert(docItem);
        const meta = {
            packageName,
            menuGroup,
            examples,
        };

        const cache = new Set<any>();
        let id = 1;
        function detectCircular(value) {
            if (value !== null && typeof value == 'object') {
                if (!Array.isArray(value)) {
                    if (cache.has(value)) {
                        if (!value._id) {
                            value._id = id++;
                        }
                        return;
                    }
                    cache.add(value);
                }
                Object.entries(value).forEach(([, value]) => {
                    // key is either an array index or object key
                    detectCircular(value);
                });
            }
        }
        detectCircular(page);
        const encountered = new Set<any>();
        const jsonData = JSON.stringify(
            { page, meta },
            (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (encountered.has(value) && value._id) {
                        return { _rid: value._id };
                    }
                    if (value._id) {
                        encountered.add(value);
                    }
                }
                return value;
            },
            2
        );

        fs.writeFileSync(outPath, jsonData);
        if (docItem.name === 'ViewModelConstructor') {
            continue;
        }
        menuByName[packageName] = menuByName[packageName] || {};
        menuByName[packageName][menuGroup] = menuByName[packageName][menuGroup] || [];
        menuByName[packageName][menuGroup].push({
            title: docItem.name,
            slug,
        });
    }

    // Combine ViewModelConstructor into BaseViewModel but as static methods/properties
    const viewModelConstructorPath = `${docsPath}/viewmodel/ViewModelConstructor.json`;
    const baseViewModelPath = `${docsPath}/viewmodel/BaseViewModel.json`;
    const viewModelConstructorData = require(viewModelConstructorPath);
    const baseViewModelData = require(baseViewModelPath);
    baseViewModelData.page.staticMethods.push(...viewModelConstructorData.page.methods);
    baseViewModelData.page.staticProperties.push(...viewModelConstructorData.page.properties);
    baseViewModelData.page.pageSections.push(
        ...viewModelConstructorData.page.pageSections.map(section => ({
            ...section,
            title: `Static ${section.title}`,
            anchorId: `Static-${section.anchorId}`,
        }))
    );
    fs.unlinkSync(viewModelConstructorPath);
    fs.writeFileSync(
        path.resolve(`${docsPath}/viewmodel/BaseViewModel.json`),
        JSON.stringify(baseViewModelData, null, 2)
    );
    const apiMenu = {};
    for (const [menuName, menu] of Object.entries(menuByName)) {
        const sections: [string, any][] = Object.entries(menu);
        sections.sort((a, b) => {
            if (a[0] === 'default') {
                return -1;
            }
            if (b[0] === 'default') {
                return 1;
            }
            return a[0].localeCompare(b[0]);
        });
        const sortedMenu: { items: any; isDefault?: boolean; title?: string }[] = [];
        for (const [sectionName, _items] of sections) {
            _items.sort((a, b) => {
                return a.title.localeCompare(b.title);
            });
            const items = _items.map(item => ({ title: item.title, href: `/docs/${item.slug}` }));
            if (sectionName === 'default') {
                sortedMenu.push({ items, isDefault: true });
            } else {
                sortedMenu.push({ items, title: sectionName });
            }
        }
        apiMenu[menuName] = sortedMenu;
    }
    fs.writeFileSync(path.resolve(docsPath, `apiMenu.json`), JSON.stringify(apiMenu, null, 2));
    const missedExamples = Object.keys(exampleFiles).filter(key => !pickedExamples.includes(key));
    if (missedExamples.length > 0) {
        console.error(`There are example files that were not matched to a source file:
    
${missedExamples.join('\n')}
    `);
    }
}

main();
