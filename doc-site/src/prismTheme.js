/**
 * Theme from https://github.com/reactjs/reactjs.org/blob/master/src/prism-styles.js
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 */
const theme = {
    plain: {
        backgroundColor: '#282c34',
        color: '#ffffff',
        fontFamily: 'monospace, monospace',
    },
    styles: [
        {
            types: ['lineHighlight'],
            style: {
                color: '#353b45',
            },
        },
        {
            types: ['primitive'],
            style: {
                color: '#5a9bcf',
            },
        },
        {
            types: ['char'],
            style: {
                color: '#d8dee9',
            },
        },
        {
            types: ['method'],
            style: {
                color: '#6699CC',
            },
        },
        {
            types: ['punctuation'],
            style: {
                color: '#88C6BE',
            },
        },
        {
            types: ['comment', 'prolog', 'doctype', 'cdata'],
            style: {
                color: '#b2b2b2',
            },
        },
        {
            types: ['namespace'],
            style: {
                opacity: 0.7,
            },
        },
        {
            types: ['operator'],
            style: {
                color: '#fc929e',
            },
        },
        {
            types: ['tag', 'number', 'token'],
            style: {
                color: '#fc929e',
            },
        },
        {
            types: ['property', 'function'],
            style: {
                color: '#79b6f2',
            },
        },
        {
            types: ['tag-id', 'selector', 'atrule-id'],
            style: {
                color: '#eeebff',
            },
        },
        {
            types: ['attr-name'],
            style: {
                color: '#c5a5c5',
            },
        },
        {
            types: ['string'],
            style: {
                color: '#8dc891',
            },
        },
        {
            types: ['boolean'],
            style: {
                color: '#ff8b50',
            },
        },
        {
            types: ['keyword'],
            style: {
                color: '#c5a5c5',
            },
        },
        {
            types: ['variable'],
            style: {
                color: '#d7deea',
            },
        },
        {
            types: [
                'entity',
                'url',
                'attr-value',
                'control',
                'directive',
                'unit',
                'statement',
                'regex',
                'placeholder',
            ],
            style: {
                color: '#c5a5c5',
            },
        },
        {
            types: ['deleted'],
            style: {
                textDecorationLine: 'line-through',
            },
        },
        {
            types: ['inserted'],
            style: {
                textDecorationLine: 'underline',
            },
        },
        {
            types: ['italic'],
            style: {
                fontStyle: 'italic',
            },
        },
        {
            types: ['important', 'bold'],
            style: {
                fontWeight: 'bold',
            },
        },
        {
            types: ['important'],
            style: {
                color: '#c4b9fe',
            },
        },
    ],
};

export const liveEditorTheme = {
    ...theme,
    plain: {
        ...theme.plain,
        marginLeft: -4,
        marginRight: -4,
        paddingRight: 2,
        paddingLeft: 2,
    },
};

export default theme;
