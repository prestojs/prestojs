import { TypeName } from '@prestojs/doc';
import React from 'react';

type Props = {};

export default function Test({}: Props) {
    return (
        <div className="p-10">
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
                                    shortTextMdx:
                                        '/*@jsxRuntime automatic @jsxImportSource react*/\nconst {jsx: _jsx, jsxs: _jsxs} = arguments[0];\nconst {useMDXComponents: _provideComponents} = arguments[0];\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = Object.assign({}, _provideComponents(), props.components);\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, _provideComponents(), props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the rejected value of the promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready."]\n    });\n  }\n}\nreturn {\n  default: MDXContent\n};\n',
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
                                deprecated: 'Use `result` instead',
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
                                    },
                                ],
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
                                    },
                                ],
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
                    },
                }}
            />
        </div>
    );
}
