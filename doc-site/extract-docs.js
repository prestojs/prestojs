/* eslint-disable */
const babel = require('@babel/core');
const prettier = require('prettier');
const TypeDoc = require('typedoc');
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
// const {
//     expandPackages,
//     loadPackageManifest,
//     getTsEntryPointForPackage,
//     ignorePackage,
// } = require('typedoc/dist/lib/utils/package-manifest.js');
// const { UnknownType } = require('typedoc/dist/lib/models');
const { normalizePath } = TypeDoc;

function readDirRecursive(dir) {
    const files = [];
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

const examplesDir = path.resolve(__dirname, 'pages/examples/');
const exampleFiles = readDirRecursive(examplesDir).reduce((acc, fn) => {
    const relativePath = fn.replace(examplesDir, '').split('.')[0].replace(/^\//, '');
    const parts = relativePath.split('/');
    const exampleName = parts.pop();
    const key = parts.join('/');
    if (!acc[key]) {
        acc[key] = [];
    }
    let source = fs.readFileSync(fn).toString();
    const match = source.match(/\/\*\*(.*)\n[ ]*\*\/(.*)/s);
    let header = { title: exampleName };
    if (match) {
        const headerText = match[1].trim().replace(/^[ ]*\*/gm, '');
        const [title, ...body] = headerText.split('\n');
        header = { title, description: body.join('\n').trim() };
        source = match[2];
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
                }).code,
                { parser: 'babel' }
            ),
            ts: source,
        },
    });
    return acc;
}, {});

const pickedExamples = [];

const root = path.resolve(__dirname, '../');
// const src = app.expandInputFiles(['../js-packages/']);

async function process(data) {
    // const transformedData = data.children.filter(child => child.name.startsWith('@presto'));
    // console.log(data.children.map(child => child.name));
    const transformedData = data.children;

    async function extractChildren(node) {
        const { children, ...rest } = node;
        let extractDocs = false;
        let menuGroup;

        let { comment } = rest;
        if (rest.kindString === 'Function' && rest.signatures && rest.signatures.length > 0) {
            comment = rest.signatures[0].comment;
        }
        const paramTags = {};
        let returnTagText;
        let docClass;
        let isForwardRef = false;
        if (comment && comment.tags) {
            const tagsByName = comment.tags.reduce((acc, tag) => {
                acc[tag.tag] = tag.text.trim();
                if (tag.tag === 'param') {
                    paramTags[tag.param] = tag.text;
                }
                if (tag.tag === 'return' || tag.tag === 'returns') {
                    returnTagText = tag.text;
                }
                return acc;
            }, {});
            extractDocs = 'extract-docs' in tagsByName;
            docClass = tagsByName['doc-class'];
            menuGroup = tagsByName['menu-group'] || 'default';
            isForwardRef = 'forward-ref' in tagsByName;
            comment.tagsByName = tagsByName;
            const dir =
                root + '/' + node.sources[0].fileName.split('/').slice(0, -1).join('/') + '/';
            if (comment.shortText && comment.shortText.includes('codesandbox=')) {
                console.log(
                    'wow',
                    comment.text,
                    comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
                );
                comment.shortText = comment.shortText.replace(
                    /codesandbox=/g,
                    `codesandbox=${dir}`
                );
            }
            if (comment.text && comment.text.includes('codesandbox=')) {
                console.log(
                    'wow',
                    comment.text,
                    comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`)
                );
                comment.text = comment.text.replace(/codesandbox=/g, `codesandbox=${dir}`);
            }
        }
        rest.isForwardRef = isForwardRef;
        rest.docClass = docClass;
        rest.extractDocs = extractDocs;
        rest.menuGroup = menuGroup;
        // Hacky workaround to get param descriptions for function type aliases
        if (
            Object.keys(paramTags).length > 0 &&
            rest.kindString === 'Type alias' &&
            rest.type.type === 'reflection' &&
            rest.type.declaration &&
            rest.type.declaration.signatures
        ) {
            rest.type.declaration.signatures[0].parameters.forEach(param => {
                if (paramTags[param.name]) {
                    param.comment = {
                        text: paramTags[param.name],
                    };
                }
            });
            rest.type.declaration.signatures[0].comment =
                rest.type.declaration.signatures[0].comment || {};
            if (returnTagText) {
                rest.type.declaration.signatures[0].comment.returns = returnTagText;
            }
        }
        if (!rest.sources) {
            // TODO: But why
            return [];
        }
        const { fileName } = rest.sources[0];
        const importPath = fileName.replace('js-packages/', '').replace('src/', '').split('.')[0];
        const slug = [...importPath.split('/').slice(0, -1), rest.name].join('/');
        const permaLink = slug.split('/').slice(1).join('/');
        const [, packageName, ...names] = slug.split('/');
        const exampleKey = importPath.replace('@prestojs/', '');
        const examples = exampleFiles[exampleKey];
        if (examples) {
            pickedExamples.push(exampleKey);
            rest.examples = examples;
        }
        rest.slug = permaLink;
        rest.packageName = packageName;
        if (children) {
            rest.childIds = children.map(child => child.id);
        }
        rest.children = children;
        if (!node.children) {
            return [rest];
        }
        const extractedChildren = [rest];
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

    const finalData = [];

    for (const child of transformedData) {
        finalData.push(...(await extractChildren(child)));
    }

    const byId = finalData.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
    }, {});

    function updateObjects(obj, fn) {
        if (fn(obj)) {
            return;
        }
        for (const value of Object.values(obj)) {
            if (Array.isArray(value)) {
                for (const v of value) {
                    if (value && typeof value == 'object') {
                        updateObjects(v, fn);
                    }
                }
            } else if (value && typeof value == 'object') {
                updateObjects(value, fn);
            }
        }
        return obj;
    }

    updateObjects(byId, obj => {
        if (obj.type === 'reference' && byId[obj.id] && byId[obj.id].extractDocs) {
            obj.referenceSlug = byId[obj.id].slug;
        }
        if (obj.tags) {
            obj.tagsByName = obj.tags.reduce((acc, tag) => {
                acc[tag.tag] = tag.text.trim();
                if (acc[tag.tag] === '') {
                    acc[tag.tag] = true;
                }
                if (tag.tag === 'hide-properties') {
                    acc[tag.tag] = tag.text.trim().split(' ');
                }
                if (tag.tag === 'expand-properties' && acc[tag.tag] !== true) {
                    // Hack to have mdx transform work on it
                    acc[tag.tag] = {
                        comment: { text: acc[tag.tag] },
                    };
                }
                return acc;
            }, {});
        }
    });

    return finalData;
}

function getEntryPointsForPackages(logger, packageGlobPaths) {
    const results = [];
    // --packages arguments are workspace tree roots, or glob patterns
    // This expands them to leave only leaf packages
    const expandedPackages = expandPackages(logger, '.', packageGlobPaths);
    for (const packagePath of expandedPackages) {
        const packageJsonPath = path.resolve(packagePath, 'package.json');
        const packageJson = loadPackageManifest(logger, packageJsonPath);
        if (packageJson === undefined) {
            logger.error(`Could not load package manifest ${packageJsonPath}`);
            return;
        }
        const packageEntryPoint = getTsEntryPointForPackage(logger, packageJsonPath, packageJson);
        if (packageEntryPoint === undefined) {
            logger.error(`Could not determine TS entry point for package ${packageJsonPath}`);
            return;
        }
        if (packageEntryPoint === ignorePackage) {
            continue;
        }
        const tsconfigFile = ts.findConfigFile(packageEntryPoint, ts.sys.fileExists);
        if (tsconfigFile === undefined) {
            logger.error(
                `Could not determine tsconfig.json for source file ${packageEntryPoint} (it must be on an ancestor path)`
            );
            return;
        }
        // Consider deduplicating this with similar code in src/lib/utils/options/readers/tsconfig.ts
        let fatalError = false;
        const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
            tsconfigFile,
            {},
            {
                ...ts.sys,
                onUnRecoverableConfigFileDiagnostic: error => {
                    logger.diagnostic(error);
                    fatalError = true;
                },
            }
        );
        if (!parsedCommandLine) {
            return;
        }
        logger.diagnostics(parsedCommandLine.errors);
        if (fatalError) {
            return;
        }
        const program = ts.createProgram({
            rootNames: parsedCommandLine.fileNames,
            options: parsedCommandLine.options,
        });
        const sourceFile = program.getSourceFile(packageEntryPoint);
        if (sourceFile === undefined) {
            logger.error(
                `Entry point "${packageEntryPoint}" does not appear to be built by the tsconfig found at "${tsconfigFile}"`
            );
            return;
        }
        results.push({
            displayName: packageJson.name,
            path: packageEntryPoint,
            program,
            sourceFile,
        });
    }
    return results;
}

function getTsFiles(dir) {
    if (dir.endsWith('__tests__')) {
        return [];
    }
    const files = [];
    for (const f of fs.readdirSync(dir)) {
        if (f === 'index.ts') {
            continue;
        }
        const fn = path.join(dir, f);
        if (fs.statSync(fn).isDirectory()) {
            files.push(...getTsFiles(fn));
        } else if (fn.endsWith('ts') || fs.endsWith('tsx')) {
            files.push(fn);
        }
    }
    return files;
}

async function main() {
    let data = [];

    const packagesRoot = path.resolve(root, 'js-packages/@prestojs/');

    for (const pkg of ['util' /*, 'viewmodel'*/]) {
        //fs.readdirSync(packagesRoot)) {
        if (pkg === 'codegen') continue;
        const app = new TypeDoc.Application();

        app.options.addReader(new TypeDoc.TSConfigReader());
        const entryPoints = getTsFiles(path.join(packagesRoot, pkg, 'src/'));
        console.log(entryPoints);
        app.bootstrap({
            // entryPoints: [path.join(packagesRoot, pkg, 'src/index.ts')],
            entryPoints,
            tsconfig: path.join(packagesRoot, pkg, 'tsconfig.json'),
            // plugin: [
            //     path.resolve(root, 'doc-site/plugins/forceExport.js'),
            //     'typedoc-plugin-rename-defaults',
            // ],
        });

        const project = app.convert();

        const tmpFile = `./___temp_${pkg}.json`;
        await app.generateJson(project, tmpFile);
        const moduleData = await process(require(tmpFile));
        data.push(...moduleData);
        // fs.unlinkSync(tmpFile);
    }

    fs.writeFileSync('./data/typeDocs.json', JSON.stringify(data, null, 2));

    const menuByName = {};
    for (const datum of data) {
        if (datum.extractDocs) {
            const slug = datum.slug.split('/').filter(Boolean);
            const groupName = datum.menuGroup;
            menuByName[datum.packageName] = menuByName[datum.packageName] || {};
            menuByName[datum.packageName][groupName] =
                menuByName[datum.packageName][groupName] || [];
            menuByName[datum.packageName][groupName].push({
                title: datum.name,
                slug: slug.join('/'),
            });
        }
    }

    fs.writeFileSync('./data/apiMenu.json', JSON.stringify(menuByName, null, 2));

    const missedExamples = Object.keys(exampleFiles).filter(key => !pickedExamples.includes(key));
    if (missedExamples.length > 0) {
        console.error(`There are example files that were not matched to a source file:
    
${missedExamples.join('\n')}
    `);
    }
}

async function main_old() {
    const app = new TypeDoc.Application();
    app.options.addReader(new TypeDoc.TSConfigReader());
    const packagesRoot = path.resolve(root, 'js-packages/@prestojs/');
    const files = app
        .expandInputFiles(
            fs.readdirSync(packagesRoot).map(f => path.resolve(packagesRoot, f, 'src/'))
        )
        .filter(f => !f.includes('.test.') && !f.endsWith('index.ts'));
    app.bootstrap({
        // target: 'es6',
        name: 'prestojs',
        // packages: fs.readdirSync(packagesRoot).map(f => path.resolve(packagesRoot, f)),
        packages: root,
        // entryPoints: fs
        //     .readdirSync(packagesRoot)
        //     .map(f => path.resolve(packagesRoot, f, 'src/index.ts')),
        // packages: ['../js-packages/@prestojs/util', '../js-packages/@prestojs/viewmodel'],
        // mode: 'modules',
        // ignoreCompilerErrors: true,
        // preserveConstEnums: true,
        exclude: ['*.test.ts', '*.test.tsx', '*/**/__tests__/**/*'],
        // 'external-modulemap': '.*packages/(@prestojs/[^/]+)/.*',
        // stripInternal: false,
        // stripExternal: true,
        excludeExternals: true,
        excludeInternal: false,
        tsconfig: '../tsconfig.lint.json',
    });

    const program = ts.createProgram(app.options.getFileNames(), app.options.getCompilerOptions());

    const printer = ts.createPrinter();

    /** @type {Map<import("typedoc").DeclarationReflection, UnknownType>} */
    const typeOverrides = new Map();

    app.converter.on(
        TypeDoc.Converter.EVENT_CREATE_DECLARATION,
        /**
         *
         * @param {import("typedoc/dist/lib/converter/context").Context} context
         * @param {import("typedoc").DeclarationReflection} reflection
         * @param {import("typescript").Node | undefined} node
         */
        (context, reflection, node) => {
            if (reflection.kind === TypeDoc.ReflectionKind.TypeAlias && node) {
                if (reflection.comment && reflection.comment.hasTag('quickinfo')) {
                    // console.log(reflection.type.types[0]._target.declarations[0].type.members);
                    reflection.comment.removeTags('quickinfo');
                    const type = context.checker.getTypeAtLocation(node);
                    const typeNode = context.checker.typeToTypeNode(
                        type,
                        node.getSourceFile(),
                        ts.NodeBuilderFlags.InTypeAlias
                    );
                    typeOverrides.set(reflection, typeNode);
                    // typeOverrides.set(reflection, context.converter.convertType(context, typeNode));
                }
            }
        }
    );

    app.converter.on(TypeDoc.Converter.EVENT_RESOLVE_BEGIN, () => {
        for (const [refl, type] of typeOverrides) {
            console.log(type);
            refl.extra = type;
        }
        typeOverrides.clear();
    });

    // Application.convert checks for compiler errors here.

    const packages = app.options.getValue('packages').map(normalizePath);
    // const entryPoints = getEntryPointsForPackages(app.logger, packages);
    // console.log(entryPoints);
    // const project = app.converter.convert(entryPoints, program);

    const project = app.convert();

    if (project) {
        const tmpFile = './___temp.json';
        await app.generateJson(project, tmpFile);
        // await app.generateDocs(project, path.resolve(root, 'doc-site/blah'));
        const data = require(tmpFile);
        // fs.unlinkSync(tmpFile);
        process(data);
    }
}

main().catch(console.error);
// process(require('./___temp.json'));
