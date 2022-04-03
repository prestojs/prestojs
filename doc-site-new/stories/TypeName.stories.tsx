import { DeclarationReflection, DocProvider, TypeName } from '@prestojs/doc';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { JSONOutput } from 'typedoc';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'doc/TypeName',
    component: TypeName,
} as ComponentMeta<typeof TypeName>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const AllSimpleTypes: ComponentStory<typeof TypeName> = () => (
    <>
        {types.map((type, i) => (
            <div style={{ marginBottom: 15 }}>
                <TypeName type={type} key={i} />
            </div>
        ))}
    </>
);

export const Reflection: ComponentStory<typeof TypeName> = () => (
    <DocProvider referencedTypes={referencedTypes}>
        <TypeName
            type={{
                type: 'reflection',
                declaration: {
                    id: 593,
                    name: '__type',
                    kind: 65536,
                    kindString: 'Type literal',
                    flags: {},
                    children: [
                        {
                            id: 595,
                            name: 'error',
                            kind: 1024,
                            kindString: 'Property',
                            flags: {},
                            comment: {
                                shortText:
                                    'Set to the rejected value of the promise. Only one of `error` and `result` can be set. If\n`isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful\nwhen you want the UI to show the previous value until the next value is ready.',
                                text: '```js\nfunction Test() {\nconst a = 5 + 5;\n}\n```',
                                shortTextMdx:
                                    '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the rejected value of the promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                textMdx:
                                    '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      pre: "pre",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.pre, {\n      children: _jsx(_components.code, {\n        className: "language-js",\n        children: "function Test() {\\nconst a = 5 + 5;\\n}\\n"\n      })\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            },
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 139,
                                    character: 4,
                                },
                            ],
                            type: {
                                type: 'union',
                                types: [
                                    {
                                        type: 'reference',
                                        id: 604,
                                        name: 'ErrorT',
                                    },
                                    {
                                        type: 'literal',
                                        value: null,
                                    },
                                ],
                            },
                            docFlags: {},
                            tagsByName: {},
                        },
                        {
                            id: 594,
                            name: 'isLoading',
                            kind: 1024,
                            kindString: 'Property',
                            flags: {},
                            comment: {
                                shortText: 'True when action is in progress.',
                                shortTextMdx:
                                    '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "True when action is in progress."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            },
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 133,
                                    character: 4,
                                },
                            ],
                            type: {
                                type: 'intrinsic',
                                name: 'boolean',
                            },
                            docFlags: {},
                            tagsByName: {},
                        },
                        {
                            id: 597,
                            name: 'response',
                            kind: 1024,
                            kindString: 'Property',
                            flags: {},
                            comment: {
                                tags: [
                                    {
                                        tag: 'deprecated',
                                        text: 'Use `result` instead\n',
                                    },
                                ],
                            },
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 150,
                                    character: 4,
                                },
                            ],
                            type: {
                                type: 'union',
                                types: [
                                    {
                                        type: 'reference',
                                        id: 603,
                                        name: 'ResultT',
                                    },
                                    {
                                        type: 'literal',
                                        value: null,
                                    },
                                ],
                            },
                            docFlags: {
                                deprecated:
                                    '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Use ", _jsx(_components.code, {\n        children: "result"\n      }), " instead"]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            },
                            tagsByName: {
                                deprecated: 'Use `result` instead',
                            },
                        },
                        {
                            id: 596,
                            name: 'result',
                            kind: 1024,
                            kindString: 'Property',
                            flags: {},
                            comment: {
                                shortText:
                                    'Set to the resolved value of promise. Only one of `error` and `result` can be set. If\n`isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful\nwhen you want the UI to show the previous value until the next value is ready (for example showing\nthe previous page of a paginated table with a loading indicator while next page is loading).',
                                shortTextMdx:
                                    '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the resolved value of promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready (for example showing\\nthe previous page of a paginated table with a loading indicator while next page is loading)."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            },
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 146,
                                    character: 4,
                                },
                            ],
                            type: {
                                type: 'union',
                                types: [
                                    {
                                        type: 'reference',
                                        id: 603,
                                        name: 'ResultT',
                                    },
                                    {
                                        type: 'literal',
                                        value: null,
                                    },
                                ],
                            },
                            docFlags: {},
                            tagsByName: {},
                        },
                        {
                            id: 601,
                            name: 'reset',
                            kind: 2048,
                            kindString: 'Method',
                            flags: {},
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 166,
                                    character: 4,
                                },
                            ],
                            signatures: [
                                {
                                    id: 602,
                                    name: 'reset',
                                    kind: 4096,
                                    kindString: 'Call signature',
                                    flags: {},
                                    comment: {
                                        shortText:
                                            'When called will set both result or error to null. Will not immediately trigger\na call to the action but subsequent changes to `fn` or `options.args` will\naccording to the value of `trigger`.',
                                        shortTextMdx:
                                            '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["When called will set both result or error to null. Will not immediately trigger\\na call to the action but subsequent changes to ", _jsx(_components.code, {\n        children: "fn"\n      }), " or ", _jsx(_components.code, {\n        children: "options.args"\n      }), " will\\naccording to the value of ", _jsx(_components.code, {\n        children: "trigger"\n      }), "."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                    },
                                    type: {
                                        type: 'intrinsic',
                                        name: 'void',
                                    },
                                    docFlags: {},
                                    tagsByName: {},
                                },
                            ],
                            docFlags: {},
                            tagsByName: {},
                        },
                        {
                            id: 598,
                            name: 'run',
                            kind: 2048,
                            kindString: 'Method',
                            flags: {},
                            sources: [
                                {
                                    fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                    line: 160,
                                    character: 4,
                                },
                            ],
                            signatures: [
                                {
                                    id: 599,
                                    name: 'run',
                                    kind: 4096,
                                    kindString: 'Call signature',
                                    flags: {},
                                    comment: {
                                        shortText:
                                            'A function to manually trigger the action. If `options.trigger` is `useAsync.MANUAL`\ncalling this function is the only way to trigger the action. You can pass\narguments to `run` which will override the defaults. If no arguments are passed then\n`options.args` will be passed by default (if supplied).',
                                        text: 'This function will return a promise that resolves/rejects to same value\nresolved/rejected from the async action.\n',
                                        shortTextMdx:
                                            '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["A function to manually trigger the action. If ", _jsx(_components.code, {\n        children: "options.trigger"\n      }), " is ", _jsx(_components.code, {\n        children: "useAsync.MANUAL"\n      }), "\\ncalling this function is the only way to trigger the action. You can pass\\narguments to ", _jsx(_components.code, {\n        children: "run"\n      }), " which will override the defaults. If no arguments are passed then\\n", _jsx(_components.code, {\n        children: "options.args"\n      }), " will be passed by default (if supplied)."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                        textMdx:
                                            '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "This function will return a promise that resolves/rejects to same value\\nresolved/rejected from the async action."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                    },
                                    parameters: [
                                        {
                                            id: 600,
                                            name: 'args',
                                            kind: 32768,
                                            kindString: 'Parameter',
                                            flags: {
                                                isRest: true,
                                            },
                                            type: {
                                                type: 'array',
                                                elementType: {
                                                    type: 'intrinsic',
                                                    name: 'any',
                                                },
                                            },
                                            docFlags: {},
                                            tagsByName: {},
                                        },
                                    ],
                                    type: {
                                        type: 'reference',
                                        typeArguments: [
                                            {
                                                type: 'reference',
                                                id: 603,
                                                name: 'ResultT',
                                            },
                                        ],
                                        qualifiedName: 'Promise',
                                        package: 'typescript',
                                        name: 'Promise',
                                    },
                                    docFlags: {},
                                    tagsByName: {},
                                },
                            ],
                            docFlags: {},
                            tagsByName: {},
                        },
                    ],
                    groups: [
                        {
                            title: 'Properties',
                            kind: 1024,
                            children: [595, 594, 597, 596],
                        },
                        {
                            title: 'Methods',
                            kind: 2048,
                            children: [601, 598],
                        },
                    ],
                    sources: [
                        {
                            fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                            line: 129,
                            character: 52,
                        },
                    ],
                    docFlags: {},
                    tagsByName: {},
                },
            }}
        />
    </DocProvider>
);

export const IntersectionOmit: ComponentStory<typeof TypeName> = () => (
    <DocProvider
        referencedTypes={{
            '392': {
                id: 392,
                name: 'PaginatorRequestOptions',
                kind: 4194304,
                kindString: 'Type alias',
                flags: {},
                sources: [
                    {
                        fileName: 'js-packages/@prestojs/util/src/pagination/Paginator.ts',
                        line: 1,
                        character: 12,
                    },
                ],
                type: {
                    type: 'intersection',
                    types: [
                        {
                            type: 'reference',
                            id: 1271,
                            typeArguments: [
                                {
                                    type: 'reference',
                                    id: 1274,
                                    qualifiedName: 'RequestInit',
                                    package: 'typescript',
                                    name: 'RequestInit',
                                },
                                {
                                    type: 'union',
                                    types: [
                                        {
                                            type: 'literal',
                                            value: 'headers',
                                        },
                                        {
                                            type: 'literal',
                                            value: 'cache',
                                        },
                                    ],
                                },
                            ],
                            qualifiedName: 'Omit',
                            package: 'typescript',
                            name: 'Omit',
                        },
                        {
                            type: 'reflection',
                            declaration: {
                                id: 393,
                                name: '__type',
                                kind: 65536,
                                kindString: 'Type literal',
                                flags: {},
                                children: [
                                    {
                                        id: 394,
                                        name: 'headers',
                                        kind: 1024,
                                        kindString: 'Property',
                                        flags: {
                                            isOptional: true,
                                        },
                                        comment: {
                                            shortText:
                                                'Any headers to add to the request. You can unset default headers that might be specified in the default\n`Endpoint.defaultConfig.requestInit` by setting the value to `undefined`.',
                                            shortTextMdx:
                                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Any headers to add to the request. You can unset default headers that might be specified in the default\\n", _jsx(_components.code, {\n        children: "Endpoint.defaultConfig.requestInit"\n      }), " by setting the value to ", _jsx(_components.code, {\n        children: "undefined"\n      }), "."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                        },
                                        sources: [
                                            {
                                                fileName:
                                                    'js-packages/@prestojs/util/src/pagination/Paginator.ts',
                                                line: 6,
                                                character: 4,
                                            },
                                        ],
                                        type: {
                                            type: 'union',
                                            types: [
                                                {
                                                    type: 'reference',
                                                    id: 1288,
                                                    qualifiedName: 'HeadersInit',
                                                    package: 'typescript',
                                                    name: 'HeadersInit',
                                                },
                                                {
                                                    type: 'reference',
                                                    id: 1267,
                                                    typeArguments: [
                                                        {
                                                            type: 'intrinsic',
                                                            name: 'string',
                                                        },
                                                        {
                                                            type: 'union',
                                                            types: [
                                                                {
                                                                    type: 'intrinsic',
                                                                    name: 'undefined',
                                                                },
                                                                {
                                                                    type: 'intrinsic',
                                                                    name: 'string',
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    qualifiedName: 'Record',
                                                    package: 'typescript',
                                                    name: 'Record',
                                                },
                                            ],
                                        },
                                        anchorId: 'Properties-headers',
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                    {
                                        id: 396,
                                        name: 'query',
                                        kind: 1024,
                                        kindString: 'Property',
                                        flags: {
                                            isOptional: true,
                                        },
                                        comment: {
                                            shortText: 'Any query request parameters',
                                            shortTextMdx:
                                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "Any query request parameters"\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                        },
                                        sources: [
                                            {
                                                fileName:
                                                    'js-packages/@prestojs/util/src/pagination/Paginator.ts',
                                                line: 14,
                                                character: 4,
                                            },
                                        ],
                                        type: {
                                            type: 'reference',
                                            id: 1267,
                                            typeArguments: [
                                                {
                                                    type: 'intrinsic',
                                                    name: 'string',
                                                },
                                                {
                                                    type: 'union',
                                                    types: [
                                                        {
                                                            type: 'intrinsic',
                                                            name: 'boolean',
                                                        },
                                                        {
                                                            type: 'intrinsic',
                                                            name: 'string',
                                                        },
                                                        {
                                                            type: 'literal',
                                                            value: null,
                                                        },
                                                        {
                                                            type: 'intrinsic',
                                                            name: 'number',
                                                        },
                                                    ],
                                                },
                                            ],
                                            qualifiedName: 'Record',
                                            package: 'typescript',
                                            name: 'Record',
                                        },
                                        anchorId: 'Properties-query',
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                    {
                                        id: 395,
                                        name: 'urlArgs',
                                        kind: 1024,
                                        kindString: 'Property',
                                        flags: {
                                            isOptional: true,
                                        },
                                        comment: {
                                            shortText:
                                                'Any arguments for the [URL](doc:UrlPattern)',
                                            shortTextMdx:
                                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      a: "a"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Any arguments for the ", _jsx(_components.a, {\n        href: "doc:UrlPattern",\n        children: "URL"\n      })]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                        },
                                        sources: [
                                            {
                                                fileName:
                                                    'js-packages/@prestojs/util/src/pagination/Paginator.ts',
                                                line: 10,
                                                character: 4,
                                            },
                                        ],
                                        type: {
                                            type: 'reference',
                                            id: 1267,
                                            typeArguments: [
                                                {
                                                    type: 'intrinsic',
                                                    name: 'string',
                                                },
                                                {
                                                    type: 'intrinsic',
                                                    name: 'any',
                                                },
                                            ],
                                            qualifiedName: 'Record',
                                            package: 'typescript',
                                            name: 'Record',
                                        },
                                        anchorId: 'Properties-urlArgs',
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                ],
                                groups: [
                                    {
                                        title: 'Properties',
                                        kind: 1024,
                                        children: [394, 396, 395],
                                    },
                                ],
                                sources: [
                                    {
                                        fileName:
                                            'js-packages/@prestojs/util/src/pagination/Paginator.ts',
                                        line: 1,
                                        character: 69,
                                    },
                                ],
                                anchorId: '__type',
                                docFlags: {},
                                tagsByName: {},
                            },
                        },
                    ],
                },
                docFlags: {},
                tagsByName: {},
                anchorId: 'PaginatorRequestOptions',
            },
            '1271': {
                id: 1271,
                name: 'Omit',
                kind: 4194304,
                kindString: 'Type alias',
                flags: {
                    isExternal: true,
                },
                comment: {
                    shortText:
                        'Construct a type with the properties of T except for those in type K.',
                    shortTextMdx:
                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "Construct a type with the properties of T except for those in type K."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                },
                sources: [
                    {
                        fileName: 'node_modules/typescript/lib/lib.es5.d.ts',
                        line: 1576,
                        character: 5,
                    },
                ],
                typeParameter: [
                    {
                        id: 1272,
                        name: 'T',
                        kind: 131072,
                        kindString: 'Type parameter',
                        flags: {
                            isExternal: true,
                        },
                        anchorId: 'T',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1273,
                        name: 'K',
                        kind: 131072,
                        kindString: 'Type parameter',
                        flags: {
                            isExternal: true,
                        },
                        type: {
                            type: 'typeOperator',
                            operator: 'keyof',
                            target: {
                                type: 'intrinsic',
                                name: 'any',
                            },
                        },
                        anchorId: 'K',
                        docFlags: {},
                        tagsByName: {},
                    },
                ],
                type: {
                    type: 'reference',
                    id: 1158,
                    typeArguments: [
                        {
                            type: 'reference',
                            id: 1272,
                            qualifiedName: 'T',
                            package: 'typescript',
                            name: 'T',
                        },
                        {
                            type: 'reference',
                            id: 1320,
                            typeArguments: [
                                {
                                    type: 'typeOperator',
                                    operator: 'keyof',
                                    target: {
                                        type: 'reference',
                                        id: 1272,
                                        qualifiedName: 'T',
                                        package: 'typescript',
                                        name: 'T',
                                    },
                                },
                                {
                                    type: 'reference',
                                    id: 1273,
                                    qualifiedName: 'K',
                                    package: 'typescript',
                                    name: 'K',
                                },
                            ],
                            qualifiedName: 'Exclude',
                            package: 'typescript',
                            name: 'Exclude',
                        },
                    ],
                    qualifiedName: 'Pick',
                    package: 'typescript',
                    name: 'Pick',
                },
                docFlags: {},
                tagsByName: {},
                anchorId: 'Omit',
            },
            '1158': {
                id: 1158,
                name: 'Pick',
                kind: 4194304,
                kindString: 'Type alias',
                flags: {
                    isExternal: true,
                },
                comment: {
                    shortText: 'From T, pick a set of properties whose keys are in the union K',
                    shortTextMdx:
                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "From T, pick a set of properties whose keys are in the union K"\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                },
                sources: [
                    {
                        fileName: 'node_modules/typescript/lib/lib.es5.d.ts',
                        line: 1552,
                        character: 5,
                    },
                ],
                typeParameter: [
                    {
                        id: 1159,
                        name: 'T',
                        kind: 131072,
                        kindString: 'Type parameter',
                        flags: {
                            isExternal: true,
                        },
                        anchorId: 'T',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1160,
                        name: 'K',
                        kind: 131072,
                        kindString: 'Type parameter',
                        flags: {
                            isExternal: true,
                        },
                        type: {
                            type: 'typeOperator',
                            operator: 'keyof',
                            target: {
                                type: 'reference',
                                id: 1159,
                                qualifiedName: 'T',
                                package: 'typescript',
                                name: 'T',
                            },
                        },
                        anchorId: 'K',
                        docFlags: {},
                        tagsByName: {},
                    },
                ],
                type: {
                    type: 'mapped',
                    parameter: 'P',
                    parameterType: {
                        type: 'reference',
                        id: 1160,
                        qualifiedName: 'K',
                        package: 'typescript',
                        name: 'K',
                    },
                    templateType: {
                        type: 'indexedAccess',
                        indexType: {
                            type: 'reference',
                            qualifiedName: 'P',
                            package: 'typescript',
                            name: 'P',
                        },
                        objectType: {
                            type: 'reference',
                            id: 1159,
                            qualifiedName: 'T',
                            package: 'typescript',
                            name: 'T',
                        },
                    },
                },
                docFlags: {},
                tagsByName: {},
                anchorId: 'Pick',
            },
            '1274': {
                id: 1274,
                name: 'RequestInit',
                kind: 256,
                kindString: 'Interface',
                flags: {
                    isExternal: true,
                },
                children: [
                    {
                        id: 1275,
                        name: 'body',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText: "A BodyInit object or null to set request's body.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A BodyInit object or null to set request\'s body."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1468,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'literal',
                                    value: null,
                                },
                                {
                                    type: 'reference',
                                    id: 1336,
                                    qualifiedName: 'BodyInit',
                                    package: 'typescript',
                                    name: 'BodyInit',
                                },
                            ],
                        },
                        anchorId: 'Properties-body',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1276,
                        name: 'cache',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A string indicating how the request will interact with the browser's cache to set request's cache.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string indicating how the request will interact with the browser\'s cache to set request\'s cache."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1470,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1337,
                            qualifiedName: 'RequestCache',
                            package: 'typescript',
                            name: 'RequestCache',
                        },
                        anchorId: 'Properties-cache',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1277,
                        name: 'credentials',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request\'s credentials."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1472,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1338,
                            qualifiedName: 'RequestCredentials',
                            package: 'typescript',
                            name: 'RequestCredentials',
                        },
                        anchorId: 'Properties-credentials',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1278,
                        name: 'headers',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A Headers object, an object literal, or an array of two-item arrays to set request's headers.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A Headers object, an object literal, or an array of two-item arrays to set request\'s headers."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1474,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1288,
                            qualifiedName: 'HeadersInit',
                            package: 'typescript',
                            name: 'HeadersInit',
                        },
                        anchorId: 'Properties-headers',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1279,
                        name: 'integrity',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A cryptographic hash of the resource to be fetched by request. Sets request's integrity.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A cryptographic hash of the resource to be fetched by request. Sets request\'s integrity."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1476,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'intrinsic',
                            name: 'string',
                        },
                        anchorId: 'Properties-integrity',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1280,
                        name: 'keepalive',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText: "A boolean to set request's keepalive.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A boolean to set request\'s keepalive."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1478,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'intrinsic',
                            name: 'boolean',
                        },
                        anchorId: 'Properties-keepalive',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1281,
                        name: 'method',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText: "A string to set request's method.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string to set request\'s method."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1480,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'intrinsic',
                            name: 'string',
                        },
                        anchorId: 'Properties-method',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1282,
                        name: 'mode',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request\'s mode."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1482,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1339,
                            qualifiedName: 'RequestMode',
                            package: 'typescript',
                            name: 'RequestMode',
                        },
                        anchorId: 'Properties-mode',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1283,
                        name: 'redirect',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request\'s redirect."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1484,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1340,
                            qualifiedName: 'RequestRedirect',
                            package: 'typescript',
                            name: 'RequestRedirect',
                        },
                        anchorId: 'Properties-redirect',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1284,
                        name: 'referrer',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                'A string whose value is a same-origin URL, "about:client", or the empty string, to set request\'s referrer.',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A string whose value is a same-origin URL, \\"about:client\\", or the empty string, to set request\'s referrer."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1486,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'intrinsic',
                            name: 'string',
                        },
                        anchorId: 'Properties-referrer',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1285,
                        name: 'referrerPolicy',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText: "A referrer policy to set request's referrerPolicy.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "A referrer policy to set request\'s referrerPolicy."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1488,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'reference',
                            id: 1341,
                            qualifiedName: 'ReferrerPolicy',
                            package: 'typescript',
                            name: 'ReferrerPolicy',
                        },
                        anchorId: 'Properties-referrerPolicy',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1286,
                        name: 'signal',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText: "An AbortSignal to set request's signal.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "An AbortSignal to set request\'s signal."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1490,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'literal',
                                    value: null,
                                },
                                {
                                    type: 'reference',
                                    id: 1342,
                                    qualifiedName: 'AbortSignal',
                                    package: 'typescript',
                                    name: 'AbortSignal',
                                },
                            ],
                        },
                        anchorId: 'Properties-signal',
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 1287,
                        name: 'window',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isExternal: true,
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                'Can only be null. Used to disassociate request from any Window.',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "Can only be null. Used to disassociate request from any Window."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                                line: 1492,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'literal',
                            value: null,
                        },
                        anchorId: 'Properties-window',
                        docFlags: {},
                        tagsByName: {},
                    },
                ],
                groups: [
                    {
                        title: 'Properties',
                        kind: 1024,
                        children: [
                            1275, 1276, 1277, 1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285, 1286,
                            1287,
                        ],
                    },
                ],
                sources: [
                    {
                        fileName: 'node_modules/typescript/lib/lib.dom.d.ts',
                        line: 1466,
                        character: 10,
                    },
                ],
                docFlags: {},
                tagsByName: {},
                anchorId: 'RequestInit',
            },
        }}
    >
        <TypeName
            type={{
                type: 'reference',
                id: 392,
                name: 'PaginatorRequestOptions',
            }}
        />
    </DocProvider>
);

const types = [
    {
        type: 'array',
        elementType: {
            type: 'union',
            types: [
                {
                    type: 'literal',
                    value: null,
                },
                {
                    type: 'intrinsic',
                    name: 'number',
                },
                {
                    type: 'intrinsic',
                    name: 'boolean',
                },
            ],
        },
    } as JSONOutput.ArrayType,
    ...(['number', 'string', 'boolean', 'any', 'void', 'undefined', 'object'].map(name => ({
        type: 'intrinsic',
        name: name,
    })) as JSONOutput.IntrinsicType[]),
    {
        type: 'intersection',
        types: [
            // TODO
        ],
    } as JSONOutput.IntersectionType,
    {
        type: 'union',
        types: [
            {
                type: 'literal',
                value: null,
            },
            {
                type: 'intrinsic',
                name: 'number',
            },
            {
                type: 'intrinsic',
                name: 'boolean',
            },
        ],
    } as JSONOutput.UnionType,
    ...([5, true, false, BigInt(1337), null, 'string'].map(value => ({
        type: 'literal',
        value,
    })) as JSONOutput.LiteralType[]),
];

const referencedTypes = {
    '581': {
        id: 581,
        name: 'UseAsyncOptions',
        kind: 4194304,
        kindString: 'Type alias',
        flags: {},
        comment: {
            tags: [
                {
                    tag: 'expand-properties',
                    text: '\n',
                },
            ],
        },
        sources: [
            {
                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                line: 79,
                character: 12,
            },
        ],
        type: {
            type: 'reflection',
            declaration: {
                id: 582,
                name: '__type',
                kind: 65536,
                kindString: 'Type literal',
                flags: {},
                children: [
                    {
                        id: 584,
                        name: 'args',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                "Arguments to be passed to asyncFn when it is called. Can be empty. If you are using `trigger` of\n`MANUAL` then it's usually simpler to just pass the arguments in `fn` manually (eg. by defining\nan arrow function inline). When using other values of `trigger` the value of `args` is compared\nand will trigger a call to `fn` when a change is detected according to the comparison logic of the\nselected `trigger`.",
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Arguments to be passed to asyncFn when it is called. Can be empty. If you are using ", _jsx(_components.code, {\n        children: "trigger"\n      }), " of\\n", _jsx(_components.code, {\n        children: "MANUAL"\n      }), " then it\'s usually simpler to just pass the arguments in ", _jsx(_components.code, {\n        children: "fn"\n      }), " manually (eg. by defining\\nan arrow function inline). When using other values of ", _jsx(_components.code, {\n        children: "trigger"\n      }), " the value of ", _jsx(_components.code, {\n        children: "args"\n      }), " is compared\\nand will trigger a call to ", _jsx(_components.code, {\n        children: "fn"\n      }), " when a change is detected according to the comparison logic of the\\nselected ", _jsx(_components.code, {\n        children: "trigger"\n      }), "."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 107,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'array',
                            elementType: {
                                type: 'intrinsic',
                                name: 'any',
                            },
                        },
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 583,
                        name: 'trigger',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {
                            isOptional: true,
                        },
                        comment: {
                            shortText:
                                'Determines when the function is called. Defaults to `MANUAL`.',
                            text: '**NOTE**: If changing from MANUAL then the function will be called immediately regardless\n\n**useAsync.MANUAL (default)** - only called when you explicitly call `run`\n\n**useAsync.SHALLOW** - called whenever a shallow equality check fails. Compares previous async function,\nand `option.args`. Passing an inline function (eg. `useAsync(() => ...)`) or an inline object\nto args (eg. `useAsync(fn, { args: { filter: 1 } })`) with this option will result in an\ninfinite loop because each render dynamically creates a new object and only object identity is checked;\nuse `useMemo` or `useCallback` in these cases.\n\n**useAsync.DEEP** - called whenever a deep equality check fails. Compares previous async function and\n`option.args`. Slower than `shallow` but works with objects that may change every render. Passing an\ninline function (eg. `useAsync(() => ...)`) with this option will result in an infinite loop as a new\nfunction is created each render and a deep equality check on this will always fail; use `useCallback` in\nthose cases.\n',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Determines when the function is called. Defaults to ", _jsx(_components.code, {\n        children: "MANUAL"\n      }), "."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            textMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      strong: "strong",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_Fragment, {\n      children: [_jsxs(_components.p, {\n        children: [_jsx(_components.strong, {\n          children: "NOTE"\n        }), ": If changing from MANUAL then the function will be called immediately regardless"]\n      }), "\\n", _jsxs(_components.p, {\n        children: [_jsx(_components.strong, {\n          children: "useAsync.MANUAL (default)"\n        }), " - only called when you explicitly call ", _jsx(_components.code, {\n          children: "run"\n        })]\n      }), "\\n", _jsxs(_components.p, {\n        children: [_jsx(_components.strong, {\n          children: "useAsync.SHALLOW"\n        }), " - called whenever a shallow equality check fails. Compares previous async function,\\nand ", _jsx(_components.code, {\n          children: "option.args"\n        }), ". Passing an inline function (eg. ", _jsx(_components.code, {\n          children: "useAsync(() => ...)"\n        }), ") or an inline object\\nto args (eg. ", _jsx(_components.code, {\n          children: "useAsync(fn, { args: { filter: 1 } })"\n        }), ") with this option will result in an\\ninfinite loop because each render dynamically creates a new object and only object identity is checked;\\nuse ", _jsx(_components.code, {\n          children: "useMemo"\n        }), " or ", _jsx(_components.code, {\n          children: "useCallback"\n        }), " in these cases."]\n      }), "\\n", _jsxs(_components.p, {\n        children: [_jsx(_components.strong, {\n          children: "useAsync.DEEP"\n        }), " - called whenever a deep equality check fails. Compares previous async function and\\n", _jsx(_components.code, {\n          children: "option.args"\n        }), ". Slower than ", _jsx(_components.code, {\n          children: "shallow"\n        }), " but works with objects that may change every render. Passing an\\ninline function (eg. ", _jsx(_components.code, {\n          children: "useAsync(() => ...)"\n        }), ") with this option will result in an infinite loop as a new\\nfunction is created each render and a deep equality check on this will always fail; use ", _jsx(_components.code, {\n          children: "useCallback"\n        }), " in\\nthose cases."]\n      })]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 99,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'query',
                                    queryType: {
                                        type: 'reference',
                                        id: 1768,
                                        name: 'MANUAL',
                                    },
                                },
                                {
                                    type: 'query',
                                    queryType: {
                                        type: 'reference',
                                        id: 1769,
                                        name: 'SHALLOW',
                                    },
                                },
                                {
                                    type: 'query',
                                    queryType: {
                                        type: 'reference',
                                        id: 1770,
                                        name: 'DEEP',
                                    },
                                },
                            ],
                        },
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 589,
                        name: 'onError',
                        kind: 2048,
                        kindString: 'Method',
                        flags: {
                            isOptional: true,
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 124,
                                character: 4,
                            },
                        ],
                        signatures: [
                            {
                                id: 590,
                                name: 'onError',
                                kind: 4096,
                                kindString: 'Call signature',
                                flags: {},
                                comment: {
                                    shortText:
                                        'Called when action errors. Passed the error returned from async action.',
                                    text: 'See note above on `onSuccess` for behaviour when component has unmounted.\n',
                                    shortTextMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "Called when action errors. Passed the error returned from async action."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                    textMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["See note above on ", _jsx(_components.code, {\n        children: "onSuccess"\n      }), " for behaviour when component has unmounted."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                },
                                parameters: [
                                    {
                                        id: 591,
                                        name: 'error',
                                        kind: 32768,
                                        kindString: 'Parameter',
                                        flags: {},
                                        type: {
                                            type: 'reference',
                                            id: 1168,
                                            qualifiedName: 'Error',
                                            package: 'typescript',
                                            name: 'Error',
                                        },
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                ],
                                type: {
                                    type: 'intrinsic',
                                    name: 'void',
                                },
                                docFlags: {},
                                tagsByName: {},
                            },
                        ],
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 585,
                        name: 'onSuccess',
                        kind: 2048,
                        kindString: 'Method',
                        flags: {
                            isOptional: true,
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 118,
                                character: 4,
                            },
                        ],
                        signatures: [
                            {
                                id: 586,
                                name: 'onSuccess',
                                kind: 4096,
                                kindString: 'Call signature',
                                flags: {},
                                comment: {
                                    shortText:
                                        'Called when action resolves successfully. Is passed a single parameter which\nis the result from the async action.',
                                    text: '**NOTE:** If your component unmounts before the promise resolves this function\nwill NOT be called. This is to avoid the general case of calling React\nstate transition functions on an unmounted component. If you want the\nmethod to be called regardless then attach your own callbacks to the\npromise when you call `run` or in the async function definition itself.\n',
                                    shortTextMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "Called when action resolves successfully. Is passed a single parameter which\\nis the result from the async action."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                    textMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      strong: "strong",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: [_jsx(_components.strong, {\n        children: "NOTE:"\n      }), " If your component unmounts before the promise resolves this function\\nwill NOT be called. This is to avoid the general case of calling React\\nstate transition functions on an unmounted component. If you want the\\nmethod to be called regardless then attach your own callbacks to the\\npromise when you call ", _jsx(_components.code, {\n        children: "run"\n      }), " or in the async function definition itself."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                },
                                parameters: [
                                    {
                                        id: 587,
                                        name: 'result',
                                        kind: 32768,
                                        kindString: 'Parameter',
                                        flags: {},
                                        type: {
                                            type: 'reflection',
                                            declaration: {
                                                id: 588,
                                                name: '__type',
                                                kind: 65536,
                                                kindString: 'Type literal',
                                                flags: {},
                                                docFlags: {},
                                                tagsByName: {},
                                            },
                                        },
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                ],
                                type: {
                                    type: 'intrinsic',
                                    name: 'void',
                                },
                                docFlags: {},
                                tagsByName: {},
                            },
                        ],
                        docFlags: {},
                        tagsByName: {},
                    },
                ],
                groups: [
                    {
                        title: 'Properties',
                        kind: 1024,
                        children: [584, 583],
                    },
                    {
                        title: 'Methods',
                        kind: 2048,
                        children: [589, 585],
                    },
                ],
                sources: [
                    {
                        fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                        line: 79,
                        character: 30,
                    },
                ],
                docFlags: {},
                tagsByName: {},
            },
        },
        docFlags: {
            expandProperties: true,
        },
        tagsByName: {
            'expand-properties': '',
        },
    },
    '592': {
        id: 592,
        name: 'UseAsyncReturnObject',
        kind: 4194304,
        kindString: 'Type alias',
        flags: {},
        sources: [
            {
                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                line: 129,
                character: 12,
            },
        ],
        typeParameter: [
            {
                id: 603,
                name: 'ResultT',
                kind: 131072,
                kindString: 'Type parameter',
                flags: {},
                docFlags: {},
                tagsByName: {},
            },
            {
                id: 604,
                name: 'ErrorT',
                kind: 131072,
                kindString: 'Type parameter',
                flags: {},
                docFlags: {},
                tagsByName: {},
            },
        ],
        type: {
            type: 'reflection',
            declaration: {
                id: 593,
                name: '__type',
                kind: 65536,
                kindString: 'Type literal',
                flags: {},
                children: [
                    {
                        id: 595,
                        name: 'error',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {},
                        comment: {
                            shortText:
                                'Set to the rejected value of the promise. Only one of `error` and `result` can be set. If\n`isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful\nwhen you want the UI to show the previous value until the next value is ready.',
                            text: '```js\nfunction Test() {\nconst a = 5 + 5;\n}\n```',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the rejected value of the promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                            textMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      pre: "pre",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.pre, {\n      children: _jsx(_components.code, {\n        className: "language-js",\n        children: "function Test() {\\nconst a = 5 + 5;\\n}\\n"\n      })\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 139,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'reference',
                                    id: 604,
                                    name: 'ErrorT',
                                },
                                {
                                    type: 'literal',
                                    value: null,
                                },
                            ],
                        },
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 594,
                        name: 'isLoading',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {},
                        comment: {
                            shortText: 'True when action is in progress.',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "True when action is in progress."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 133,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'intrinsic',
                            name: 'boolean',
                        },
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 597,
                        name: 'response',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {},
                        comment: {
                            tags: [
                                {
                                    tag: 'deprecated',
                                    text: 'Use `result` instead\n',
                                },
                            ],
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 150,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'reference',
                                    id: 603,
                                    name: 'ResultT',
                                },
                                {
                                    type: 'literal',
                                    value: null,
                                },
                            ],
                        },
                        docFlags: {
                            deprecated:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Use ", _jsx(_components.code, {\n        children: "result"\n      }), " instead"]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        tagsByName: {
                            deprecated: 'Use `result` instead',
                        },
                    },
                    {
                        id: 596,
                        name: 'result',
                        kind: 1024,
                        kindString: 'Property',
                        flags: {},
                        comment: {
                            shortText:
                                'Set to the resolved value of promise. Only one of `error` and `result` can be set. If\n`isLoading` is true consider this stale (ie. based on _previous_ props). This can be useful\nwhen you want the UI to show the previous value until the next value is ready (for example showing\nthe previous page of a paginated table with a loading indicator while next page is loading).',
                            shortTextMdx:
                                '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the resolved value of promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready (for example showing\\nthe previous page of a paginated table with a loading indicator while next page is loading)."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                        },
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 146,
                                character: 4,
                            },
                        ],
                        type: {
                            type: 'union',
                            types: [
                                {
                                    type: 'reference',
                                    id: 603,
                                    name: 'ResultT',
                                },
                                {
                                    type: 'literal',
                                    value: null,
                                },
                            ],
                        },
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 601,
                        name: 'reset',
                        kind: 2048,
                        kindString: 'Method',
                        flags: {},
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 166,
                                character: 4,
                            },
                        ],
                        signatures: [
                            {
                                id: 602,
                                name: 'reset',
                                kind: 4096,
                                kindString: 'Call signature',
                                flags: {},
                                comment: {
                                    shortText:
                                        'When called will set both result or error to null. Will not immediately trigger\na call to the action but subsequent changes to `fn` or `options.args` will\naccording to the value of `trigger`.',
                                    shortTextMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["When called will set both result or error to null. Will not immediately trigger\\na call to the action but subsequent changes to ", _jsx(_components.code, {\n        children: "fn"\n      }), " or ", _jsx(_components.code, {\n        children: "options.args"\n      }), " will\\naccording to the value of ", _jsx(_components.code, {\n        children: "trigger"\n      }), "."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                },
                                type: {
                                    type: 'intrinsic',
                                    name: 'void',
                                },
                                docFlags: {},
                                tagsByName: {},
                            },
                        ],
                        docFlags: {},
                        tagsByName: {},
                    },
                    {
                        id: 598,
                        name: 'run',
                        kind: 2048,
                        kindString: 'Method',
                        flags: {},
                        sources: [
                            {
                                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                                line: 160,
                                character: 4,
                            },
                        ],
                        signatures: [
                            {
                                id: 599,
                                name: 'run',
                                kind: 4096,
                                kindString: 'Call signature',
                                flags: {},
                                comment: {
                                    shortText:
                                        'A function to manually trigger the action. If `options.trigger` is `useAsync.MANUAL`\ncalling this function is the only way to trigger the action. You can pass\narguments to `run` which will override the defaults. If no arguments are passed then\n`options.args` will be passed by default (if supplied).',
                                    text: 'This function will return a promise that resolves/rejects to same value\nresolved/rejected from the async action.\n',
                                    shortTextMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["A function to manually trigger the action. If ", _jsx(_components.code, {\n        children: "options.trigger"\n      }), " is ", _jsx(_components.code, {\n        children: "useAsync.MANUAL"\n      }), "\\ncalling this function is the only way to trigger the action. You can pass\\narguments to ", _jsx(_components.code, {\n        children: "run"\n      }), " which will override the defaults. If no arguments are passed then\\n", _jsx(_components.code, {\n        children: "options.args"\n      }), " will be passed by default (if supplied)."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                    textMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p"\n    }, _provideComponents(), props.components);\n    return _jsx(_components.p, {\n      children: "This function will return a promise that resolves/rejects to same value\\nresolved/rejected from the async action."\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
                                },
                                parameters: [
                                    {
                                        id: 600,
                                        name: 'args',
                                        kind: 32768,
                                        kindString: 'Parameter',
                                        flags: {
                                            isRest: true,
                                        },
                                        type: {
                                            type: 'array',
                                            elementType: {
                                                type: 'intrinsic',
                                                name: 'any',
                                            },
                                        },
                                        docFlags: {},
                                        tagsByName: {},
                                    },
                                ],
                                type: {
                                    type: 'reference',
                                    typeArguments: [
                                        {
                                            type: 'reference',
                                            id: 603,
                                            name: 'ResultT',
                                        },
                                    ],
                                    qualifiedName: 'Promise',
                                    package: 'typescript',
                                    name: 'Promise',
                                },
                                docFlags: {},
                                tagsByName: {},
                            },
                        ],
                        docFlags: {},
                        tagsByName: {},
                    },
                ],
                groups: [
                    {
                        title: 'Properties',
                        kind: 1024,
                        children: [595, 594, 597, 596],
                    },
                    {
                        title: 'Methods',
                        kind: 2048,
                        children: [601, 598],
                    },
                ],
                sources: [
                    {
                        fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                        line: 129,
                        character: 52,
                    },
                ],
                docFlags: {},
                tagsByName: {},
            },
        },
        docFlags: {},
        tagsByName: {},
    },
    '603': {
        id: 603,
        name: 'ResultT',
        kind: 131072,
        kindString: 'Type parameter',
        flags: {},
        docFlags: {},
        tagsByName: {},
    },
    '604': {
        id: 604,
        name: 'ErrorT',
        kind: 131072,
        kindString: 'Type parameter',
        flags: {},
        docFlags: {},
        tagsByName: {},
    },
    '1168': {
        id: 1168,
        name: 'Error',
        kind: 32,
        kindString: 'Variable',
        flags: {
            isExternal: true,
        },
        sources: [
            {
                fileName: 'node_modules/typescript/lib/lib.es5.d.ts',
                line: 1033,
                character: 12,
            },
        ],
        type: {
            type: 'reference',
            qualifiedName: 'ErrorConstructor',
            package: 'typescript',
            name: 'ErrorConstructor',
        },
        extendedBy: [
            {
                type: 'reference',
                id: 564,
                name: 'InvalidTimeError',
            },
        ],
        docFlags: {},
        tagsByName: {},
    },
    '1757': {
        id: 1757,
        name: 'ResultT',
        kind: 131072,
        kindString: 'Type parameter',
        flags: {},
        docFlags: {},
        tagsByName: {},
    },
    '1758': {
        id: 1758,
        name: 'ErrorT',
        kind: 131072,
        kindString: 'Type parameter',
        flags: {},
        default: {
            type: 'reference',
            id: 1168,
            qualifiedName: 'Error',
            package: 'typescript',
            name: 'Error',
        },
        docFlags: {},
        tagsByName: {},
    },
    '1768': {
        id: 1768,
        name: 'MANUAL',
        kind: 32,
        kindString: 'Variable',
        flags: {},
        sources: [
            {
                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                line: 66,
                character: 6,
            },
        ],
        type: {
            type: 'literal',
            value: 'MANUAL',
        },
        defaultValue: "'MANUAL'",
        docFlags: {},
        tagsByName: {},
    },
    '1769': {
        id: 1769,
        name: 'SHALLOW',
        kind: 32,
        kindString: 'Variable',
        flags: {},
        sources: [
            {
                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                line: 67,
                character: 6,
            },
        ],
        type: {
            type: 'literal',
            value: 'SHALLOW',
        },
        defaultValue: "'SHALLOW'",
        docFlags: {},
        tagsByName: {},
    },
    '1770': {
        id: 1770,
        name: 'DEEP',
        kind: 32,
        kindString: 'Variable',
        flags: {},
        sources: [
            {
                fileName: 'js-packages/@prestojs/util/src/useAsync.ts',
                line: 68,
                character: 6,
            },
        ],
        type: {
            type: 'literal',
            value: 'DEEP',
        },
        defaultValue: "'DEEP'",
        docFlags: {},
        tagsByName: {},
    },
} as Record<string, DeclarationReflection>;
