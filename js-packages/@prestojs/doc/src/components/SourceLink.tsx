import React from 'react';
import { SourceLocation } from '../newTypes';

export default function SourceLink({ sourceLocation }: { sourceLocation?: SourceLocation }) {
    if (!sourceLocation) {
        return null;
    }
    return (
        <a
            target="_blank"
            href={`https://github.com/prestojs/prestojs/tree/master/${sourceLocation.fileName}#L${sourceLocation.line}`}
            className="text-gray-700 text-sm underline hover:text-gray-900"
        >
            Source
        </a>
    );
}
