import { FunctionSignature } from '@prestojs/doc';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { JSONOutput } from 'typedoc';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'doc/FunctionSignature',
    component: FunctionSignature,
} as ComponentMeta<typeof FunctionSignature>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof FunctionSignature> = args => (
    <FunctionSignature signature={data} {...args} />
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    primary: true,
    label: 'Button',
};

const data = {
    id: 1756,
    name: 'useAsync',
    kind: 4096,
    kindString: 'Call signature',
    flags: {},
    comment: {
        shortText:
            'Hook to deal with triggering async function calls and handling result / errors and loading states.',
        text: 'This can be used in two distinct modes:\n - _manual_ (`useAsync.MANUAL`) - the function is only triggered explicitly\n - _automatic_ (`useAsync.DEEP` or `useAsync.SHALLOW`) - the function is triggered initially\nand then automatically when argument values change (using a shallow or deep comparison).\n\nFor mutations you usually want _manual_ as it is triggered in response to some user action\nlike pressing a button.\n\nFor data fetching you usually want _automatic_ mode as you retrieve some data\ninitially and then refetch it when some arguments change (eg. the id for a single\nrecord or the filters for a list).\n\n## Examples\n\nFetch and render a specified github profile\n\n```js live horizontal\nfunction FollowerCount() {\n    const [user, setUser] = React.useState(\'octocat\')\n    const { result, isLoading, error, run, reset } = useAsync(() => getGithubUser(user));\n    return (\n        <div>\n            <input value={user} onChange={e => setUser(e.target.value)} />\n            <div className="my-2 justify-between flex">\n            <button onClick={run} disabled={isLoading} className="btn-blue">Query follower count</button>\n            <button className="btn" onClick={reset}>Clear</button>\n            </div>\n            {result && (\n                <p>\n                    <img src={result.avatar_url} /><br />\n                    {result.name} has {result.followers} followers\n                </p>\n            )}\n            {error && (<p>Failed with status: {error.status} {error.statusText}</p>)}\n        </div>\n    );\n}\n// we don\'t define this inside FollowerCount() because that will create a new function on\n// every render, causing useAsync() to re-run and triggering an infinite render loop\nfunction getGithubUser(user) {\n  return fetch(`https://api.github.com/users/${user}`).then(r => {\n     if (r.ok) {\n         return r.json();\n     }\n     throw r;\n  });\n}\n```',
        tags: [
            {
                tag: 'extract-docs',
                text: '\n',
            },
        ],
    },
    typeParameter: [
        {
            id: 1757,
            name: 'ResultT',
            kind: 131072,
            kindString: 'Type parameter',
            flags: {},
        },
        {
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
        },
    ],
    parameters: [
        {
            id: 1759,
            name: 'fn',
            kind: 32768,
            kindString: 'Parameter',
            flags: {},
            comment: {
                shortText:
                    "A function that returns a promise. When `trigger` is `MANUAL` this is only\ncalled when you manually call the returned `run` function, otherwise it's called\ninitially and then whenever an equality comparison fails between previous arguments and new\narguments. Note that when `trigger` is `SHALLOW` or `DEEP` changes to this function will\ncause it to be called again so you must memoize it (eg. with `useCallback`) if it's defined\nin your component or hook. To help detect runaway effects caused by this automatically\nconsider using [stop-runaway-react-effects](https://github.com/kentcdodds/stop-runaway-react-effects).\n\n",
            },
            type: {
                type: 'reflection',
                declaration: {
                    id: 1760,
                    name: '__type',
                    kind: 65536,
                    kindString: 'Type literal',
                    flags: {},
                    signatures: [
                        {
                            id: 1761,
                            name: '__type',
                            kind: 4096,
                            kindString: 'Call signature',
                            flags: {},
                            parameters: [
                                {
                                    id: 1762,
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
                                        id: 1757,
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
            },
        },
        {
            id: 1763,
            name: 'options',
            kind: 32768,
            kindString: 'Parameter',
            flags: {},
            type: {
                type: 'reference',
                id: 581,
                name: 'UseAsyncOptions',
            },
            defaultValue: '{}',
        },
    ],
    type: {
        type: 'reference',
        id: 592,
        typeArguments: [
            {
                type: 'reference',
                id: 1757,
                name: 'ResultT',
            },
            {
                type: 'reference',
                id: 1758,
                name: 'ErrorT',
            },
        ],
        name: 'UseAsyncReturnObject',
    },
} as JSONOutput.SignatureReflection;
