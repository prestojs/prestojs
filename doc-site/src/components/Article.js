import React from 'react';

export default function Article({ children, ...rest }) {
    return <article {...rest}>{children}</article>;
}
