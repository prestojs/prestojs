import React from 'react';

export default function MdxWrapper({ mdx }) {
    if (!mdx) {
        return null;
    }
    return <div dangerouslySetInnerHTML={{ __html: mdx }} />;
}
