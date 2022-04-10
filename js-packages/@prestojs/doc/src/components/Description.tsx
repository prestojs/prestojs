import { Flags, RichDescription } from '@prestojs/doc/newTypes';
import React from 'react';
import PrecompiledMarkdown from './PrecompiledMarkdown';

type Props = {
    description?: RichDescription;
    flags?: Flags;
};

export default function Description({ description, flags }: Props) {
    if (!flags?.isDeprecated && (!description || (!description.short && !description.long))) {
        return null;
    }

    return (
        <>
            {description?.short && <PrecompiledMarkdown code={description.short} />}
            {description?.long && <PrecompiledMarkdown code={description.long} />}
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
