import React from 'react';

export default function SourceLink({ doc }) {
    if (!doc.sources || doc.sources.length === 0) {
        return null;
    }
    const source = doc.sources[0];
    return (
        <a
            target="_blank"
            href={`https://github.com/prestojs/prestojs/tree/master/${source.fileName}#L${source.line}`}
            className="text-gray-700 text-sm underline hover:text-gray-900"
        >
            Source
        </a>
    );
}
