import babel from '@babel/core';
import { compile } from '@mdx-js/mdx';
import {
    ClassConstructor,
    ClassPage,
    ClassPageHierarchy,
    ContainerType,
    DocExample,
    DocNode,
    DocType,
    ExternalReferenceType,
    Flags,
    FunctionPage,
    IndexSignatureType,
    PageSection,
    ReferenceLinkType,
    RichDescription,
    Signature,
    SignatureParameter,
    TypeParameter,
    UnknownType,
    VariableNode,
} from '@prestojs/doc';
import { TypeArgumentReference } from '@prestojs/doc/newTypes';
import fs from 'fs';
import { createRequire } from 'node:module';
import path, { dirname } from 'path';
import prettier from 'prettier';
import TypeDoc, {
    DeclarationReflection,
    LiteralType,
    MappedType,
    ParameterReflection,
    ProjectReflection,
    ReferenceReflection,
    ReferenceType,
    Reflection,
    ReflectionKind,
    ReflectionType,
    SignatureReflection,
    SomeType,
    SourceReference,
    TypeParameterReflection,
    UnionType,
} from 'typedoc';

import { visit } from 'unist-util-visit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
type IntersectWithReference = {
    type: 'intersectWithReference';
    reference: SomeType;
    omitKeys: ReturnType<typeof getOmitKeys>;
    sourceDeclaration?: DeclarationReflection;
};

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
                    if (node.value[0] === ';') {
                        node.value = node.value.slice(1);
                    }
                } catch (e) {
                    console.warn('Example not parseable: ', node.value);
                }
            }
        });
    };
}

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
    const exampleName = parts.pop() || '';
    const key = parts.join('/');
    if (!acc[key]) {
        acc[key] = [];
    }
    let source = fs.readFileSync(fn).toString();
    const match = source.match(/^\/\*\*(.*)\n(( \*.*\n)*) \*\/((.*\n)*)/);
    let header = {
        title: exampleName,
        description: '',
        tags: {},
        anchorId:
            'example-' +
            exampleName
                .split(' ')
                .join('-')
                .replace(/[^a-zA-Z0-9-]/g, ''),
    };
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
        Object.assign(header, { title: title.trim(), description: body.join('\n').trim(), tags });
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

function getOmitKeys(type: ReferenceType) {
    if (!type.typeArguments) {
        return [];
    }
    const omitTypes = type.typeArguments[1] as LiteralType | UnionType;
    if (!omitTypes) {
        return [];
    }
    return omitTypes.type === 'union'
        ? omitTypes.types.map((t: LiteralType) => t.value)
        : [omitTypes.value];
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

function getComment(docItem: DeclarationReflection | SignatureReflection | ParameterReflection) {
    let { comment } = docItem;
    if (!comment && 'signatures' in docItem && docItem.signatures) {
        comment = docItem.signatures.filter(sig => !sig.comment?.getTag('@hidden'))[0]?.comment;
    }
    return comment;
}

function isTypeOnly(docItem: DeclarationReflection) {
    return [
        ReflectionKind.Interface,
        ReflectionKind.TypeAlias,
        ReflectionKind.TypeLiteral,
        ReflectionKind.TypeParameter,
    ].includes(docItem.kind);
}

/**
 * Caches based on FIRST argument only
 */
function cacheMethodFirstArg() {
    const fnCache = new Map();
    return function (_: any, __: string, descriptor: PropertyDescriptor) {
        let method = descriptor.value;
        descriptor.value = function (cacheKey, ...args) {
            if (fnCache.has(cacheKey)) {
                return fnCache.get(cacheKey);
            }
            const result = method.bind(this)(cacheKey, ...args);
            fnCache.set(cacheKey, result);
            return result;
        };
    };
}

function getDocUrl(declaration: Reflection): string | false {
    if (!(declaration instanceof DeclarationReflection)) {
        return false;
    }
    if (declaration.name === 'ViewModelInterface' || declaration.name === 'ViewModelClassType') {
        return `/docs/viewmodel/viewModelFactory`;
    }
    if (declaration.name === 'PartialViewModel') {
        return `/docs/viewmodel/BaseViewModel#PartialViewModel`;
    }
    if (declaration.name === 'ViewModelConstructor') {
        return `/docs/viewmodel/BaseViewModel#ViewModelConstructor`;
    }
    if (declaration.name === 'RecordBoundField') {
        return `/docs/viewmodel/Field#RecordBoundField`;
    }
    if (getComment(declaration)?.hasModifier('@extractdocs')) {
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

function hasModifier(decl: DeclarationReflection, tagName: `@${string}`) {
    if (decl.comment) {
        return decl.comment.hasModifier(tagName);
    }
    if (decl.signatures) {
        for (const sig of decl.signatures) {
            if (sig.comment?.hasModifier(tagName)) {
                return true;
            }
        }
    }
    return false;
}

function makeOptional(children: DeclarationReflection[]) {
    return children.map(child => {
        return new Proxy(child, {
            get(target, prop) {
                if (prop === 'flags') {
                    return new Proxy(target.flags, {
                        get(target, prop) {
                            if (prop === 'isOptional') {
                                return true;
                            }
                            return target[prop];
                        },
                    });
                }
                return target[prop];
            },
        });
    });
}

class DeclarationReflectionConverter {
    project: ProjectReflection;
    docLinks: any;
    exampleFiles: Record<string, DocExample[]>;
    constructor(
        project: ProjectReflection,
        docLinks: any,
        exampleFiles: Record<string, DocExample[]>
    ) {
        this.docLinks = docLinks;
        this.project = project;
        this.exampleFiles = exampleFiles;
    }
    async convertFlags(
        declaration: DeclarationReflection | ParameterReflection | SignatureReflection
    ) {
        const comment = getComment(declaration);
        const flags: Flags = {};
        if (
            declaration.flags?.isOptional ||
            ('defaultValue' in declaration && declaration.defaultValue != null)
        ) {
            flags.isOptional = true;
        }
        if (!!declaration.flags?.isRest) {
            flags.isRestArg = true;
        }
        if (comment) {
            const deprecated = comment.getTag('@deprecated');
            if (deprecated) {
                flags.isDeprecated = true;
                const text = deprecated.content
                    .map(({ text }) => text)
                    .join('')
                    .trim();
                if (text) {
                    flags.deprecatedReason = await compileMdx(text, this.docLinks);
                }
            }
            if (comment.getTag('@expandproperties')) {
                flags.expandProperties = true;
            }
            if (comment.getTag('@forwardref')) {
                flags.isForwardRef = true;
            }
            const hideProperties = comment.getTag('@hideproperties');
            if (hideProperties) {
                flags.hideProperties = hideProperties.content
                    .map(({ text }) => text)
                    .join('')
                    .trim()
                    .split(' ');
            }
        }

        return flags;
    }

    externalReferencesByPackage = {
        '@types/react': {
            FocusEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent',
        },
        typescript: {
            RequestInit: 'https://developer.mozilla.org/en-US/docs/Web/API/fetch#init',
            HeadersInit: 'https://developer.mozilla.org/en-US/docs/Web/API/fetch#headers',
            // Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
            Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
            'Intl.DateTimeFormatOptions':
                'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters',
            InputRef:
                'https://github.com/react-component/input/blob/87d62916e0e91e5465771885d0cf96af90dfc4d2/src/interface.ts#L113',
        },
        'react-final-form': {
            FieldProps: 'https://final-form.org/docs/react-final-form/types/FieldProps',
            FormProps: 'https://final-form.org/docs/react-final-form/types/FormProps',
            FinalFormProps: 'https://final-form.org/docs/react-final-form/types/FormProps',
            FormRenderProps: 'https://final-form.org/docs/react-final-form/types/FormRenderProps',
            FieldRenderProps: 'https://final-form.org/docs/react-final-form/types/FieldRenderProps',
        },
        antd: {
            CheckboxProps: 'https://4x.ant.design/components/checkbox/#API',
            Checkbox: 'https://4x.ant.design/components/checkbox/#API',
            'Checkbox.Group': 'https://4x.ant.design/components/checkbox/#Checkbox-Group',
            Input: 'https://4x.ant.design/components/input/#API',
            InputNumber: 'https://4x.ant.design/components/input-number/#API',
            'Input.Password': 'https://4x.ant.design/components/input/#Input.Password',
            SelectProps: 'https://4x.ant.design/components/select/#API',
        },
    };

    private convertExternalReference(type: ReferenceType): UnknownType | ExternalReferenceType {
        let name = type.qualifiedName;
        if (!name || name.includes('__type') || name === '_default' || name.startsWith('__')) {
            name = type.name;
        }
        if (type.externalUrl) {
            return {
                typeName: 'externalReference',
                name,
                url: type.externalUrl,
            };
        }
        if (type.package && this.externalReferencesByPackage[type.package]?.[name]) {
            return {
                typeName: 'externalReference',
                name,
                url: this.externalReferencesByPackage[type.package]?.[type.qualifiedName],
            };
        }
        return {
            typeName: 'unknown',
            name,
        };
    }

    /**
     * Extract any links from the generated MDX
     */
    extractInPageLinks(
        declaration: DeclarationReflection | SignatureReflection,
        description?: RichDescription,
        extraSections?: PageSection[]
    ): PageSection[] {
        const inPageLinks: PageSection[] = [];
        if (description && declaration.comment) {
            let section: null | PageSection = null;
            const value = declaration.comment.summary
                .map(({ text }) => text)
                .join('')
                .trim();
            if (value) {
                const matches = value
                    .split('\n')
                    .map(line => line.match(/^(#+) (.*)$/) || line.match(/^<Usage/))
                    .filter(Boolean) as RegExpMatchArray[];
                if (matches.length > 0) {
                    for (const [str, hashes, title] of matches) {
                        const heading = `h${hashes?.length}`;
                        if (!['h2', 'h3', 'h4'].includes(heading) && str !== '<Usage') {
                            throw new Error(`Dunno how to handle ${heading} - update logic`);
                        }
                        if (str === '<Usage') {
                            if (section) {
                                inPageLinks.push(section);
                            }
                            section = {
                                title: 'Usage',
                                showEmpty: true,
                                anchorId: 'Usage',
                                links: [],
                            };
                        }
                        if (heading === 'h2') {
                            if (section) {
                                inPageLinks.push(section);
                            }
                            section = {
                                title,
                                showEmpty: true,
                                anchorId: title
                                    .split(' ')
                                    .join('-')
                                    .replace(/[^a-zA-Z0-9-]/g, ''),
                                links: [],
                            };
                        }
                        if (heading === 'h3') {
                            if (!section) {
                                section = {
                                    anchorId:
                                        inPageLinks.length === 0
                                            ? 'main-content'
                                            : title
                                                  .split(' ')
                                                  .join('-')
                                                  .replace(/[^a-zA-Z0-9-]/g, ''),
                                    title: declaration.name,
                                    showEmpty: true,
                                    links: [],
                                };
                            }
                            section.links.push({
                                title: title,
                                anchorId: title
                                    .split(' ')
                                    .join('-')
                                    .replace(/[^a-zA-Z0-9-]/g, ''),
                                links: [],
                            });
                        }
                        if (heading === 'h4') {
                            if (!section) {
                                section = {
                                    anchorId:
                                        inPageLinks.length === 0
                                            ? 'main-content'
                                            : title
                                                  .split(' ')
                                                  .join('-')
                                                  .replace(/[^a-zA-Z0-9-]/g, ''),
                                    title: declaration.name,
                                    showEmpty: true,
                                    links: [],
                                };
                            }
                            const links =
                                section.links[section.links.length - 1]?.links || section.links;
                            links.push({
                                title: title,
                                anchorId: title
                                    .split(' ')
                                    .join('-')
                                    .replace(/[^a-zA-Z0-9-]/g, ''),
                                links: [],
                            });
                        }
                    }
                }
            }
            if (section) {
                inPageLinks.push(section);
            }
        }
        if (extraSections) {
            inPageLinks.push(...extraSections);
        }
        const { fileName = '' } = declaration.sources?.[0] || {};
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(1, -1), declaration.name].join('/');
        const exampleKey = slug.replace('@prestojs/', '').trim();
        const examples: undefined | DocExample[] = this.exampleFiles[exampleKey];
        if (examples) {
            inPageLinks.push({
                title: 'Examples',
                showEmpty: true,
                anchorId: 'examples',
                links: examples.map(({ header }) => ({
                    title: header.title,
                    anchorId: header.anchorId,
                    links: [],
                })),
            });
        }
        return inPageLinks;
    }

    createPage(decl: DeclarationReflection) {
        const originalName = decl.name;
        if (decl instanceof ReferenceReflection) {
            const target = decl.getTargetReflection();
            if (!target || !(target instanceof DeclarationReflection)) {
                throw new Error('Expected target to exist and be a DeclarationReflection');
            }
            if (target.kindOf(ReflectionKind.TypeLiteral) && target.signatures) {
                return this.createFunctionPage(target, originalName);
            }
            throw new Error(
                `Don't know how to handle reflection kind ${ReflectionKind.singularString(
                    target.kind
                )}`
            );
        }
        if (!hasModifier(decl, '@extractdocs')) {
            return null;
        }
        if (decl.kindOf(ReflectionKind.Class)) {
            return this.createClassPage(decl, originalName);
        }
        if (decl.kindOf(ReflectionKind.Function)) {
            return this.createFunctionPage(decl, originalName);
        }
        if (decl.kindOf(ReflectionKind.Interface)) {
            return this.createClassPage(decl, originalName);
        }
        if (decl.kindOf(ReflectionKind.TypeAlias)) {
            return this.createTypeAliasPage(decl);
        }

        throw new Error(`Unexpected reflection kind ${ReflectionKind.singularString(decl.kind)}`);
    }

    private async createClassPage(decl: DeclarationReflection, name: string): Promise<ClassPage> {
        const getMethod = (method: DeclarationReflection): false | DeclarationReflection => {
            if (method.kindOf(ReflectionKind.Method)) {
                return method;
            }
            // See Paginator.setInternalState for example of this - it's assigned in constructor:
            // this.setInternalState = () => {...}
            if (
                method.kindOf(ReflectionKind.Property) &&
                method.type instanceof ReflectionType &&
                method.type.declaration?.signatures
            ) {
                return method.type.declaration;
            }
            const ref = this.getReferenceReflection(method.type);
            if (method.type instanceof ReferenceType && ref) {
                if (
                    ref.kindOf(ReflectionKind.Interface) &&
                    ref.signatures &&
                    ref.signatures.length > 0
                ) {
                    return new Proxy(ref, {
                        get(target, prop) {
                            if (prop === 'name') {
                                return method.name;
                            }
                            if (prop === 'signatures') {
                                return target[prop]?.map(
                                    sig =>
                                        new Proxy(sig, {
                                            get(target, prop) {
                                                if (prop === 'name') {
                                                    return method.name;
                                                }
                                                return target[prop];
                                            },
                                        })
                                );
                            }
                            return target[prop];
                        },
                    });
                }
            }
            return false;
        };

        function getMethods(
            methods: DeclarationReflection[],
            isStatic: boolean
        ): DeclarationReflection[] {
            return methods
                .map(getMethod)
                .filter(m => m && !!m.flags?.isStatic === isStatic) as DeclarationReflection[];
        }

        function getProperties(
            properties: DeclarationReflection[],
            isStatic: boolean
        ): DeclarationReflection[] {
            return orderBy(
                properties.filter(
                    m =>
                        !getMethod(m) &&
                        (m.kindOf(ReflectionKind.Property) || m.kindOf(ReflectionKind.Accessor)) &&
                        !!m.flags?.isStatic === isStatic
                ),
                'name'
            );
        }

        const children = decl.children?.filter(child => !child.flags?.isPrivate) || [];
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
            await Promise.all(getProperties(children, true).map(m => this.convertClassProperty(m))),
            'name'
        );

        const description = await this.convertComment(decl.comment);

        const pageSections: PageSection[] = [
            {
                title: 'API',
                anchorId: 'api',
                links: [
                    {
                        title: 'Methods',
                        anchorId: 'Methods',
                        links: methods.map(method => ({
                            title: method.name,
                            anchorId: method.signatures[0].anchorId,
                            isInherited: method.signatures[0].isInherited,
                            links: [],
                        })),
                    },
                    {
                        title: 'Properties',
                        anchorId: 'Properties',
                        links: properties.map(prop => ({
                            title: prop.name,
                            anchorId: prop.anchorId,
                            isInherited: prop.isInherited,
                            links: [],
                        })),
                    },
                    {
                        title: 'Static Methods',
                        anchorId: 'Static-Methods',
                        links: staticMethods.map(method => ({
                            title: method.name,
                            anchorId: method.signatures[0].anchorId,
                            isInherited: method.signatures[0].isInherited,
                            links: [],
                        })),
                    },
                    {
                        title: 'Static Properties',
                        anchorId: 'Static-Properties',
                        links: staticProperties.map(prop => ({
                            title: prop.name,
                            anchorId: prop.anchorId,
                            isInherited: prop.isInherited,
                            links: [],
                        })),
                    },
                ].filter(section => section.links.length > 0),
            },
        ].filter(section => section.links.length > 0);
        pageSections.unshift(...(this.extractInPageLinks(decl, description) || []));

        let hierarchy: ClassPageHierarchy = {
            parent: null,
            children: [],
        };
        if (decl.extendedTypes?.length) {
            const extendedType = decl.extendedTypes[0];
            if (extendedType instanceof ReferenceType) {
                const referencedType = this.getReferenceReflection(extendedType);
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
        if (decl.extendedBy?.length) {
            for (const item of decl.extendedBy) {
                const referencedType = this.getReferenceReflection(item);
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
                            item.name,
                            referencedType.name
                        );
                    }
                } else {
                    console.error('Expected only reference types', item);
                }
            }
        }

        return {
            pageType: 'class',
            pageSections,
            hierarchy,
            sourceLocation: this.convertSourceLocation(decl.sources),
            name,
            description,
            constructorDefinition: await this.convertConstructor(decl),
            methods,
            properties,
            staticMethods,
            staticProperties,
            typeParameters: await this.convertTypeParameter(decl.typeParameters),
            isTypeOnly: isTypeOnly(decl),
            hideConstructor: !!decl.comment?.getTag('@hideconstructor'),
        };
    }

    private async convertConstructor(
        declaration: DeclarationReflection
    ): Promise<ClassConstructor | undefined> {
        const constructor = declaration.children?.find(child =>
            child.kindOf(ReflectionKind.Constructor)
        );
        if (!constructor) {
            return undefined;
        }
        return {
            signatures: await this.convertSignatures(constructor.signatures || []),
        };
    }

    async convertSignatures(signatures: TypeDoc.Models.SignatureReflection[]) {
        const transformed: Signature[] = [];
        for (const signature of signatures) {
            if (signature.comment?.getTag('@hidden')) {
                continue;
            }
            transformed.push(await this.convertSignature(signature));
        }
        return transformed;
    }

    private async convertClassMethod(m: DeclarationReflection) {
        const signatures = m.signatures || [];
        return this.fixUnnamedFunction(
            {
                typeName: 'methodType',
                name: m.name,
                signatures: await this.convertSignatures(signatures),
            },
            m
        );
    }

    private async convertClassProperty(property: DeclarationReflection): Promise<VariableNode> {
        if (!property.type && property.getSignature) {
            property = property.getSignature as unknown as DeclarationReflection;
        }
        const { type } = property;
        if (!type) {
            throw new Error('Expected type');
        }
        return {
            ...(await this.createNode(property, 'Property')),
            type: await this.convertType(type, property),
            isInherited: !!property.inheritedFrom,
        };
    }

    fixUnnamedFunction<T extends DocType>(type: T, dec: Reflection): T {
        // This is where parameter like:
        // isEquals: (a, b) => boolean
        // The function def will get __type as the name so when we render it
        // in modal it looks bad. Render is as isEquals instead
        if (type.typeName === 'methodType' && type.name === '__type') {
            if (dec.parent) {
                type.name = dec.parent.name;
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

    resolvedTypeParameters = new Map<Exclude<string, undefined>, TypeParameter[]>();

    async convertTypeParameter(
        typeParameters: DeclarationReflection['typeParameters']
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
        typeParameters: Exclude<DeclarationReflection['typeParameters'], undefined>
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

    private async createFunctionPage(
        decl: DeclarationReflection,
        name: string
    ): Promise<FunctionPage> {
        const originalSig = decl.signatures?.[0];
        const signatures = await this.convertSignatures(decl.signatures || []);
        const pageSections: PageSection[] = [];
        if (signatures.length > 0 && originalSig) {
            const sig = signatures[0];
            sig.description;
            let extraSections: PageSection[] = [];
            if (sig.parameters) {
                extraSections.push({
                    title: sig.isComponent ? 'Props' : 'Arguments',
                    showEmpty: true,
                    anchorId: `${sig.anchorId}-props`,
                    links: [],
                });
            }
            if (sig.description) {
                pageSections.push(
                    ...(this.extractInPageLinks(originalSig, sig.description, extraSections) || [])
                );
            } else {
                pageSections.push(...extraSections);
            }
        }
        return {
            pageType: 'function',
            name,
            signatures,
            description: await this.convertComment(decl.comment),
            sourceLocation: this.convertSourceLocation(decl.sources),
            typeParameters: await this.convertTypeParameter(decl.typeParameters),
            pageSections,
            // hacky workaround, not sure why these are considered type aliases
            isTypeOnly: !['FormItem', 'FormField'].includes(name) && isTypeOnly(decl),
            hideApi: !!getComment(decl)?.hasModifier('@hideapi'),
        };
    }

    private createTypeAliasPage(decl: DeclarationReflection) {
        // Currently not supported, not sure if we need it
        return null;
    }

    async createNode(
        declaration: DeclarationReflection | SignatureReflection,
        anchorPrefix: string,
        name?: string
    ): Promise<DocNode> {
        return {
            anchorId: this.generateAnchorId(declaration, anchorPrefix, name),
            flags: await this.convertFlags(declaration),
            name: name ?? declaration.name,
            description: await this.convertComment(declaration.comment),
            sourceLocation: this.convertSourceLocation(declaration.sources),
        };
    }

    private async convertSignature(signature: SignatureReflection): Promise<Signature> {
        const parameters: SignatureParameter[] = await Promise.all(
            (signature.parameters || []).map(async param => {
                if (!param.type) {
                    throw new Error('Expected param.type to be defined');
                }
                const refType =
                    param.type instanceof ReferenceType
                        ? this.getReferenceReflection(param.type)
                        : undefined;
                const type = await this.convertType(param.type, param);
                const baseComment = param.comment || refType?.comment;
                const comment = baseComment
                    ? new Proxy(baseComment, {
                          get(target, p): any {
                              if (param?.comment?.[p]) {
                                  return param?.comment?.[p];
                              }
                              if (refType) {
                                  return refType?.comment?.[p];
                              }
                              return null;
                          },
                      })
                    : undefined;
                const name = param.name === '__namedParameters' ? 'props' : param.name;
                return {
                    name,
                    type: type,
                    flags: {
                        ...(await this.convertFlags(param)),
                        ...(refType instanceof DeclarationReflection
                            ? await this.convertFlags(refType)
                            : {}),
                    },
                    description: await this.convertComment(comment),
                };
            })
        );
        const isComponent =
            signature.name[0].match(/[a-zA-Z]/) &&
            !signature.parent.kindOf(ReflectionKind.Interface)
                ? signature.name[0] === signature.name[0].toUpperCase()
                : false;
        let name = signature.name;
        if (name === '__type') {
            let parent: Reflection | undefined = signature.parent;
            while (parent && name === '__type') {
                name = parent.name;
                parent = parent.parent;
            }
        }
        return {
            ...(await this.createNode(signature, 'Method', name)),
            name,
            parameters,
            typeParameters: await this.convertTypeParameter(signature.typeParameters),
            returnType: await this.convertType(signature.type as SomeType, signature),
            isInherited: !!signature.inheritedFrom,
            isComponent,
        };
    }

    anchorIds = new Map<DeclarationReflection, Set<string>>();
    private generateAnchorId(
        declaration: DeclarationReflection | SignatureReflection,
        anchorPrefix: string,
        name: string = declaration.name
    ) {
        const anchorIds =
            this.anchorIds.get(declaration.parent as DeclarationReflection) || new Set();
        this.anchorIds.set(declaration.parent as DeclarationReflection, anchorIds);
        let anchorId = `${anchorPrefix.split(' ').join(' ')}-${name.split(' ').join('-')}`;
        let i = 1;
        let nextAnchorId = anchorId;
        while (anchorIds.has(nextAnchorId)) {
            nextAnchorId = `${anchorId}-${i}`;
            i++;
        }
        anchorIds.add(nextAnchorId);
        return anchorId;
    }

    private convertSourceLocation(sources?: SourceReference[] | null) {
        if (!sources || sources.length === 0) {
            return undefined;
        }
        const source = sources[0];
        return {
            fileName: source.fileName,
            line: source.line,
            character: source.character,
            url: source.url,
        };
    }

    shouldExpand(param: Reflection): param is DeclarationReflection {
        if (!(param instanceof DeclarationReflection)) {
            return false;
        }
        if (
            param.name === '__namedParameters' ||
            (param.type?.type == 'reflection' && param.type.declaration)
        ) {
            return true;
        }
        if (param.comment?.getTag('@expandproperties')) {
            return true;
        }
        if (
            param instanceof ReferenceType &&
            param.reflection &&
            this.shouldExpand(param.reflection)
        ) {
            return true;
        }
        return false;
    }

    private resolveName(
        declaration: DeclarationReflection | SignatureReflection | ParameterReflection | undefined
    ) {
        if (!declaration) {
            return '<unknown>';
        }
        let name = declaration.name;
        if (name === '__type' && declaration?.parent) {
            name = declaration.parent.name;
        }
        if (name === '__namedParameters') {
            name = 'Object';
        }
        return name;
    }

    async createIndexSignatureType(
        indexSignature: SignatureReflection
    ): Promise<IndexSignatureType> {
        if (!indexSignature.type) {
            throw new Error('Expected indexSignature.type to be defined');
        }
        return {
            typeName: 'indexSignature',
            description: await this.convertComment(indexSignature.comment),
            parameters: [],
            type: await this.convertType(indexSignature.type, indexSignature),
        };
    }

    async createContainerType(
        children: (
            | DeclarationReflection
            | ParameterReflection
            | { indexSignature: SignatureReflection }
            | { type: IntersectWithReference }
        )[],
        source?: DeclarationReflection | SignatureReflection | ParameterReflection
    ): Promise<ContainerType> {
        const obj: ContainerType = {
            typeName: 'container',
            name: source ? this.resolveName(source) : undefined,
            children: [],
            intersections: [],
        };
        if (source && 'indexSignature' in source) {
            let indexSignature = source?.indexSignature;
            if (!indexSignature) {
                indexSignature = children.find(
                    child => 'indexSignature' in child && child.indexSignature
                    // @ts-ignore
                )?.indexSignature;
            }
            if (indexSignature) {
                obj.indexSignature = await this.createIndexSignatureType(indexSignature);
            }
        }
        if (source?.type?.type === 'reflection' && source.type.declaration?.signatures) {
            obj.signatures = await this.convertSignatures(
                source.type.declaration?.signatures || []
            );
            obj.signatures.forEach(sig => {
                if (source.name) {
                    sig.name = source.name[0].toLowerCase() + source.name.slice(1);
                }
            });
        }
        const intersectRefs = children.filter(
            child => 'type' in child && child.type?.type === 'intersectWithReference'
        ) as { type: IntersectWithReference }[];
        const realChildren = children.filter(
            // @ts-ignore
            child => !child.indexSignature && !intersectRefs.includes(child)
        ) as DeclarationReflection[];
        // this.resolvedContainers.set(children, obj);
        obj.intersections = await Promise.all(
            intersectRefs.map(async child => ({
                typeName: 'propertiesFrom',
                type: await this.convertType(child.type.reference, child.type.sourceDeclaration),
                excludeProperties: child.type.omitKeys as string[],
            }))
        );

        const hidePropertiesTag = source?.comment?.getTag('@hideproperties');
        let hideProperties: string[] = [];
        if (hidePropertiesTag) {
            hideProperties = hidePropertiesTag.content
                .map(({ text }) => text)
                .join('')
                .trim()
                .split(' ');
        }
        obj.children = (
            await Promise.all(
                realChildren.map(async child => {
                    if (!(child instanceof DeclarationReflection)) {
                        throw new Error('Expected child to be a DeclarationReflection type');
                    }
                    let { comment } = child;
                    const originalChild = child;
                    let childType: DocType | null = null;
                    if (child.type instanceof ReflectionType) {
                        const dec = child.type.declaration;
                        comment = dec.comment;
                        if (dec.signatures) {
                            if (!comment && dec.signatures) {
                                comment = dec.signatures.filter(
                                    sig => !sig.comment?.getTag('@hidden')
                                )[0]?.comment;
                            }
                        }
                    }
                    if (child instanceof ReferenceType && child.reflection) {
                        if (!(child instanceof DeclarationReflection)) {
                            throw new Error('TODO: Handle this');
                        }
                        child = child.reflection as DeclarationReflection;
                    }
                    if (!comment) {
                        comment = child.comment;
                    }
                    if (
                        child.kindOf(ReflectionKind.Method) ||
                        (child.kindOf(ReflectionKind.Interface) && child.signatures)
                    ) {
                        if (!comment && child.signatures) {
                            comment = child.signatures[0]?.comment;
                        }
                        childType = await this.createMethodType(child);
                    } else {
                        if (!child.type) {
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
                })
            )
        ).filter(child => !hideProperties.includes(child.name));
        return obj;
    }
    resolvedChildren = new Map<
        Exclude<DeclarationReflection['type'], undefined>,
        DeclarationReflection[] | undefined
    >();
    async resolveChildrenFromType(
        type: Exclude<DeclarationReflection['type'], undefined>,
        sourceDeclaration?: DeclarationReflection
    ) {
        if (this.resolvedChildren.has(type)) {
            return this.resolvedChildren.get(type);
        }
        const children = await this._resolveChildrenFromType(type, sourceDeclaration);
        this.resolvedChildren.set(type, children);
        return children;
    }

    async _resolveChildrenFromType(
        type: Exclude<DeclarationReflection['type'], undefined>,
        sourceDeclaration?: DeclarationReflection
    ) {
        // if (type instanceof ReferenceType && type.reflection) {
        //     const docUrl = getDocUrl(type.reflection);
        //     // Shortcut it... if we want to link to them don't expand children just say it intersects with them
        //     // later on where we handle intersectWithReference it will convert type to a referenceLink
        //     if (docUrl) {
        //         return [{ type: { type: 'intersectWithReference', reference: type } }];
        //     }
        // }
        if (type.type === 'reference' && type.name === 'Omit' && type.typeArguments) {
            const children = await this.resolveChildrenFromType(
                type.typeArguments[0],
                sourceDeclaration
            );
            if (children) {
                const omitKeys = getOmitKeys(type);
                return orderBy(
                    children.filter(child => !omitKeys.includes(child.name)),
                    'name'
                );
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
        if (type.type === 'reference' && type.name === 'Pick' && type.typeArguments) {
            const children = await this.resolveChildrenFromType(
                type.typeArguments[0],
                sourceDeclaration
            );
            if (children) {
                const pickTypes = type.typeArguments[1] as LiteralType | UnionType;
                const pickKeys =
                    pickTypes.type === 'union'
                        ? pickTypes.types.map((t: LiteralType) => t.value)
                        : [pickTypes.value];
                return orderBy(
                    children.filter(child => pickKeys.includes(child.name)),
                    'name'
                );
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
        const ref = this.getReferenceReflection(type);
        if (type instanceof ReferenceType && ref) {
            return this.resolveChildren(ref);
        }
        if (type.type === 'reflection' && type.declaration) {
            return this.resolveChildren(type.declaration);
        }
        if (type.type === 'intersection') {
            return orderBy(
                (
                    await Promise.all(
                        type.types.map(t => this.resolveChildrenFromType(t, sourceDeclaration))
                    )
                ).reduce(
                    (
                        acc: (DeclarationReflection | { type: IntersectWithReference })[],
                        children: DeclarationReflection[] | undefined,
                        i
                    ) => {
                        if (!children) {
                            let t = type.types[i];
                            let omitKeys;
                            // @ts-ignore
                            if (t.name === 'Omit') {
                                // @ts-ignore
                                omitKeys = getOmitKeys(t);
                                // Instead of showing 'Any properties from Omit' show the type
                                // omit was from. This will be very fragile.
                                // @ts-ignore
                                t = t.typeArguments[0];
                            }
                            acc.push({
                                type: {
                                    type: 'intersectWithReference',
                                    reference: t,
                                    omitKeys,
                                    sourceDeclaration,
                                },
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
            const children = await this.resolveChildrenFromType(
                type.typeArguments[0],
                sourceDeclaration
            );
            if (children) {
                return makeOptional(children);
            } else {
                // console.warn('Missing referenced type', type.typeArguments[0]);
            }
        }
    }

    async resolveChildren(
        declaration: DeclarationReflection
    ): Promise<(DeclarationReflection | { indexSignature: SignatureReflection })[] | undefined> {
        let children;
        if (declaration.children) {
            children = orderBy(declaration.children, 'name');
        } else {
            const { type } = declaration;
            if (type) {
                return this.resolveChildrenFromType(type, declaration);
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

    getReferenceReflection(type: SomeType | undefined) {
        if (type instanceof ReferenceType) {
            let decl = type.reflection;
            if (!decl) {
                decl = Object.values(this.project.reflections).find(
                    (f: DeclarationReflection) =>
                        f.name === type.name &&
                        type.package === f.sources?.[0].fileName.match(/@prestojs\/[a-z-]*/)?.[0]
                );
            }
            return decl as DeclarationReflection;
        }
        return null;
    }

    @cacheMethodFirstArg()
    private async convertType(
        type: SomeType | IntersectWithReference,
        sourceDeclaration?: DeclarationReflection | SignatureReflection | ParameterReflection
    ): Promise<DocType> {
        if (!type) {
            throw new Error('Expected type');
        }
        if (type instanceof ReferenceType) {
            if (type.type === 'reference' && type.name === 'ComponentProps' && type.typeArguments) {
                if (type.typeArguments[0].type === 'query') {
                    const { queryType } = type.typeArguments[0];
                    if (queryType.type === 'reference') {
                        return {
                            typeName: 'componentProps',
                            type: await this.convertType(queryType),
                        };
                    }
                }
            }
            if (
                type.package === 'typescript' &&
                type.qualifiedName === 'Map' &&
                type.typeArguments?.length === 2
            ) {
                return {
                    typeName: 'es6Map',
                    keyType: await this.convertType(type.typeArguments[0]),
                    valueType: await this.convertType(type.typeArguments[1]),
                };
            }

            if (type.package === 'typescript' && type.name === 'Partial' && type.typeArguments) {
                const children = await this.resolveChildrenFromType(
                    type.typeArguments[0],
                    sourceDeclaration as DeclarationReflection
                );
                if (children) {
                    return this.createContainerType(makeOptional(children));
                } else {
                    // console.warn('Missing referenced type', type.typeArguments[0]);
                }
            }

            if (type.package === 'typescript' || type.package === 'antd') {
                return this.convertExternalReference(type);
            }

            let decl = this.getReferenceReflection(type);

            if (!decl) {
                if (type.refersToTypeParameter) {
                    return this.convertTypeParameterReference(type, sourceDeclaration);
                } else {
                    // console.log('Reference not found', sourceDeclaration?.name, type.name);
                }

                return this.convertExternalReference(type);
            }
            if (decl instanceof TypeParameterReflection) {
                return this.convertTypeParameterReference(type, sourceDeclaration);
            }
            const url = getDocUrl(decl);
            if (url) {
                return {
                    typeName: 'referenceLink',
                    name: decl.name,
                    url,
                } as ReferenceLinkType;
            }

            if (
                decl instanceof DeclarationReflection &&
                decl.parent?.name === '<internal>' &&
                !decl.sources?.[0].fileName.startsWith('js-packages/')
            ) {
                return { typeName: 'unknown', name: type.name };
            }
            let shouldExpand = this.shouldExpand(decl);
            if (decl instanceof DeclarationReflection && decl.type instanceof ReflectionType) {
                decl = decl.type.declaration;
                shouldExpand = true;
            }
            if (shouldExpand && decl instanceof DeclarationReflection) {
                const children = await this.resolveChildren(decl);
                if (children) {
                    return this.createContainerType(children, decl);
                }
            }
            if (decl.kindOf(ReflectionKind.Interface)) {
                return this.convertInterface(decl as DeclarationReflection);
            }
            if (
                decl instanceof DeclarationReflection &&
                decl.kindOf(ReflectionKind.TypeAlias) &&
                decl.name === 'Record' &&
                decl.type instanceof MappedType
            ) {
                // TODO: This could be better
                return {
                    typeName: 'unknown',
                    name: 'Record',
                };
            }
            if (decl instanceof DeclarationReflection && decl.type) {
                return this.convertType(decl.type, decl);
            }
            return {
                typeName: 'unknown',
                name: decl.name === '__type' ? type.name : decl.name,
            };
        }
        if (type.type === 'intersectWithReference') {
            return {
                typeName: 'propertiesFrom',
                type: await this.convertType(
                    type.reference,
                    sourceDeclaration || type.sourceDeclaration
                ),
                excludeProperties: type.omitKeys as string[],
            };
        }
        if (type.type === 'array') {
            return {
                typeName: 'array',
                elementType: await this.convertType(type.elementType, sourceDeclaration),
            };
        }
        if (type.type === 'reflection') {
            const { declaration } = type;
            if (declaration?.children) {
                const children = await this.resolveChildren(declaration);
                if (children) {
                    return this.createContainerType(children, declaration);
                }
            }
            if (type.declaration) {
                if (
                    type.declaration.kindOf(ReflectionKind.Method) ||
                    (type.declaration.kindOf(ReflectionKind.TypeLiteral) &&
                        type.declaration.signatures)
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
            const children: DeclarationReflection[] = await this.resolveChildrenFromType(
                type,
                sourceDeclaration as DeclarationReflection
            );
            return this.createContainerType(children, sourceDeclaration);
        }
        if (type.type === 'literal') {
            return {
                typeName: 'literal',
                value: type.value,
            };
        }
        if (type.type === 'union') {
            const types = await Promise.all(
                type.types.map(t => this.convertType(t, sourceDeclaration))
            );
            return {
                typeName: 'union',
                types,
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
                elements: await Promise.all(
                    (type.elements || []).map(e => this.convertType(e, sourceDeclaration))
                ),
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
                    [type.trueType, type.falseType].map(t => this.convertType(t, sourceDeclaration))
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
        if (type.type === 'unknown') {
            return {
                typeName: 'unknown',
                name: type.name,
            };
        }

        console.log('Unknown type', type);
        return {
            typeName: 'unknown',
            name: type.type,
        };
    }

    private async createMethodType(child: DeclarationReflection): Promise<DocType> {
        const children = await Promise.all(
            (child.children || []).map(child => this.convertType(child.type as SomeType, child))
        );
        return {
            name: this.resolveName(child),
            typeName: 'methodType',
            signatures: await this.convertSignatures(child.signatures || []),
            children,
        };
    }

    private async convertInterface(decl: DeclarationReflection): Promise<DocType> {
        if (decl.signatures) {
            return this.createMethodType(decl);
        }
        return {
            typeName: 'interface',
            classPage: await this.createClassPage(decl, decl.name),
        };
    }

    private async convertComment(comment: DeclarationReflection['comment']) {
        const description: RichDescription = {};
        if (comment?.summary) {
            const text = comment.summary
                .map(({ text }) => text)
                .join('')
                .trim();
            description.short = await compileMdx(text, this.docLinks);
        }
        const returns = comment?.getTag('@returns');
        if (returns) {
            description.returns = await compileMdx(
                returns.content
                    .map(({ text }) => text)
                    .join('')
                    .trim(),
                this.docLinks
            );
        }
        // if (comment?.text) {
        //     description.long = await compileMdx(comment?.text, this.docLinks);
        // }
        // if (comment?.shortText) {
        //     description.short = await compileMdx(comment?.shortText, this.docLinks);
        // }
        // if (comment?.returns) {
        //     description.returns = await compileMdx(comment?.returns, this.docLinks);
        // }
        if (Object.keys(description).length === 0) {
            return undefined;
        }
        return description;
    }

    private findTypeParameter(
        name: string,
        sourceDeclaration:
            | DeclarationReflection
            | SignatureReflection
            | ParameterReflection
            | Reflection
            | undefined
    ) {
        if (!sourceDeclaration) {
            return null;
        }
        const parent = sourceDeclaration.parent;
        if (parent && 'typeParameters' in parent && parent.typeParameters) {
            for (const param of parent.typeParameters) {
                if (param.name === name) {
                    return param;
                }
            }
        }
        return this.findTypeParameter(name, parent);
    }

    private async convertTypeParameterReference(
        type: ReferenceType | TypeParameterReflection,
        sourceDeclaration?: DeclarationReflection | SignatureReflection | ParameterReflection
    ): Promise<TypeArgumentReference> {
        const typeParam = this.findTypeParameter(type.name, sourceDeclaration);
        let comment = typeParam?.comment;
        const inheritFrom = typeParam?.comment?.summary?.find(
            tag => tag.kind === 'inline-tag' && tag.tag === '@inheritTypeParam'
        )?.text;
        if (inheritFrom) {
            const target = Object.values(this.project.reflections).find(
                r => r.name === inheritFrom
            );
            if (target instanceof DeclarationReflection) {
                let typeParameters = target.typeParameters;
                if (!typeParameters && target.signatures?.length) {
                    typeParameters = target.signatures[0].typeParameters;
                }
                const match = typeParameters?.find(t => t.name === type.name);
                if (match?.comment) {
                    comment = match.comment;
                }
            }
        }

        return {
            typeName: 'typeArgument',
            name: type.name,
            description: await this.convertComment(comment),
            id: -1,
        };
    }
}

function getMenuGroup(child: DeclarationReflection) {
    let comment = child.comment;
    if (!child.comment && child.signatures) {
        comment = child.signatures.filter(sig => !sig.comment?.getTag('@hidden'))[0]?.comment;
    }
    const tag = comment?.getTag('@menugroup');
    if (tag) {
        return tag.content
            .map(({ text }) => text)
            .join('')
            .trim();
    }
    return 'default';
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

async function writePages(
    pages: { page: ClassPage | FunctionPage; declaration: DeclarationReflection }[],
    docLinks: any
) {
    const docsPath = path.resolve(__dirname, '../data/');
    const menuByName: Record<string, Record<string, { slug: string; title: string }[]>> = {};
    let id = 1;

    for (const { declaration, page } of pages) {
        const menuGroup = getMenuGroup(declaration);
        const mod = declaration.parent as DeclarationReflection;
        const packageName = mod.name.split('/')[0];
        const { fileName = '' } = declaration.sources?.[0] || {};
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(1, -1), declaration.name].join('/');
        const packageDir = `${docsPath}/${packageName}`;
        const outPath = path.resolve(packageDir, `${slug.split('/').slice(1).join('/')}.json`);
        const exampleKey = slug.replace('@prestojs/', '').trim();
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

        const meta = {
            packageName,
            menuGroup,
            examples,
        };
        if (!fs.existsSync(path.dirname(outPath))) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
        }
        const cache = new Set<any>();
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
        if (['RecordBoundField', 'ViewModelConstructor'].includes(page.name)) continue;
        menuByName[packageName] = menuByName[packageName] || {};
        menuByName[packageName][menuGroup] = menuByName[packageName][menuGroup] || [];
        menuByName[packageName][menuGroup].push({
            title: page.name,
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

async function main() {
    const repoRoot = path.resolve(__dirname, '../../');
    const packagesRoot = path.resolve(repoRoot, 'js-packages/@prestojs/');

    const app = new TypeDoc.Application();

    app.options.addReader(new TypeDoc.TSConfigReader());
    const entryPoints = ['final-form', 'ui-antd', 'rest', 'ui', 'viewmodel', 'routing', 'util'].map(
        pkg => path.join(packagesRoot, pkg, 'src/index.ts')
    );
    await app.bootstrapWithPlugins({
        entryPoints: entryPoints,
        tsconfig: path.join(__dirname, '../../tsconfig.json'),
        entryPointStrategy: 'expand',
        plugin: [
            'typedoc-plugin-rename-defaults',
            'typedoc-plugin-missing-exports',
            'typedoc-plugin-mdn-links',
            path.resolve(__dirname, 'expandTypes.ts'),
            path.resolve(__dirname, 'fixReferenceTypeName.ts'),
        ],
        modifierTags: ['@extractdocs', '@hideapi'],
        inlineTags: ['@inheritTypeParam'],
    });

    const project = app.convert();
    if (!project?.children) {
        throw new Error('convert failed');
    }
    const byName = Object.values(project.reflections).reduce((acc, decl) => {
        acc[decl.name] = decl;
        return acc;
    }, {});
    const docLinks = makeDocLinksPlugin(byName);
    const converter = new DeclarationReflectionConverter(project, docLinks, exampleFiles);
    const pages: { page: ClassPage | FunctionPage; declaration: DeclarationReflection }[] = [];
    for (const mod of project.children) {
        if (!mod.kindOf(ReflectionKind.Module)) {
            throw new Error('Expected child to be a module');
        }
        if (!mod.children) {
            throw new Error('Expected module to have children');
        }
        for (let child of mod.children) {
            try {
                const page = await converter.createPage(child);
                if (!page) {
                    continue;
                }
                pages.push({ page, declaration: child });
            } catch (e) {
                console.error('Failed to convert', child, e);
            }
        }
    }
    await writePages(pages, docLinks);
}

main();
