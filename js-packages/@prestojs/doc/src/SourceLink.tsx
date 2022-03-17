import React from 'react';
import { DeclarationReflection } from './types';

export default function SourceLink({ declaration }: { declaration: DeclarationReflection }) {
    const { sources } = declaration;
    if (!sources || sources.length === 0) {
        return null;
    }
    const source = sources[0];
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
