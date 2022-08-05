import React, { ComponentProps } from 'react';
import { Prism } from 'react-syntax-highlighter';

/**
 * Theme from https://github.com/reactjs/reactjs.org/blob/master/src/prism-styles.js
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 */
const theme = {
    'pre[class*="language-"]': {
        background: '#282c34',
        color: '#ffffff',
        fontFamily: 'monospace, monospace',
        fontSize: '.875rem',
        padding: '1em',
        borderRadius: '.5rem',
        WebkitFontSmoothing: 'antialiased',
        overflowX: 'auto',
    },
    lineHighlight: {
        color: '#353b45',
    },
    primitive: {
        color: '#5a9bcf',
    },
    char: {
        color: '#d8dee9',
    },
    method: {
        color: '#6699CC',
    },
    punctuation: {
        color: '#88C6BE',
    },
    comment: {
        color: '#b2b2b2',
    },
    prolog: {
        color: '#b2b2b2',
    },
    doctype: {
        color: '#b2b2b2',
    },
    cdata: {
        color: '#b2b2b2',
    },
    namespace: {
        opacity: 0.7,
    },
    operator: {
        color: '#fc929e',
    },
    tag: {
        color: '#fc929e',
    },
    number: {
        color: '#fc929e',
    },
    token: {
        color: '#fc929e',
    },
    property: {
        color: '#79b6f2',
    },
    function: {
        color: '#79b6f2',
    },
    'tag-id': {
        color: '#eeebff',
    },
    selector: {
        color: '#eeebff',
    },
    'atrule-id': {
        color: '#eeebff',
    },
    'attr-name': {
        color: '#c5a5c5',
    },
    string: {
        color: '#8dc891',
    },
    boolean: {
        color: '#ff8b50',
    },
    keyword: {
        color: '#c5a5c5',
    },
    variable: {
        color: '#d7deea',
    },
    entity: {
        color: '#c5a5c5',
    },
    url: {
        color: '#c5a5c5',
    },
    'attr-value': {
        color: '#c5a5c5',
    },
    control: {
        color: '#c5a5c5',
    },
    directive: {
        color: '#c5a5c5',
    },
    unit: {
        color: '#c5a5c5',
    },
    statement: {
        color: '#c5a5c5',
    },
    regex: {
        color: '#c5a5c5',
    },
    placeholder: {
        color: '#c5a5c5',
    },
    deleted: {
        textDecorationLine: 'line-through',
    },
    inserted: {
        textDecorationLine: 'underline',
    },
    italic: {
        fontStyle: 'italic',
    },
    important: {
        color: '#c4b9fe',
    },
    bold: {
        fontWeight: 'bold',
    },
};

export default function CodeBlock({
    children,
    className,
    ...rest
}: {
    children: React.ReactNode;
    className?: string;
} & ComponentProps<typeof Prism>): React.ReactElement {
    return (
        <Prism language="jsx" style={theme} className={className} {...rest}>
            {children}
        </Prism>
    );
}
