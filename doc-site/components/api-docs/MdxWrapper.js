import React from 'react';

export default function MdxWrapper({ mdx }) {
    if (!mdx) {
        return null;
    }
    return <div className="mdx" dangerouslySetInnerHTML={{ __html: mdx }} />;
}
