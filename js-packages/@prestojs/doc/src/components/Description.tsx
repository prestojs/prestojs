import React from 'react';
import { Flags, RichDescription } from '../newTypes';
import PrecompiledMarkdown from './PrecompiledMarkdown';

type Props = {
    shortOnly?: boolean;
    description?: RichDescription;
    flags?: Flags;
};

export default function Description({ description, flags, shortOnly }: Props) {
    if (!flags?.isDeprecated && (!description || (!description.short && !description.long))) {
        return null;
    }
    if (!description?.short) {
        shortOnly = false;
    }
    return (
        <>
            {description?.short && <PrecompiledMarkdown code={description.short} />}
            {description?.long && !shortOnly && <PrecompiledMarkdown code={description.long} />}
            {flags?.isDeprecated && (
                <div className="text-red-400 flex">
                    <strong className="mr-1">Deprecated{flags.deprecatedReason ? ': ' : ''}</strong>
                    {flags.deprecatedReason && (
                        <PrecompiledMarkdown code={flags.deprecatedReason} />
                    )}
                </div>
            )}
        </>
    );
}
