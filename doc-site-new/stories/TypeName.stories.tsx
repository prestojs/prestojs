import { TypeName } from '@prestojs/doc';
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
                        // @ts-ignore
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
