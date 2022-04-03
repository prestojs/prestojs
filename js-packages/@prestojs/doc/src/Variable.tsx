import React from 'react';
import { JSONOutput } from 'typedoc';
import AnchorLink from './AnchorLink';
import Comment from './Comment';
import TypeName from './TypeName';

export default function Variable({ variable }: { variable: JSONOutput.DeclarationReflection }) {
    return (
        <div className="border-t-2 border-gray-200 mt-3 pt-3">
            <AnchorLink
                id={variable.anchorId}
                component="h4"
                className="text-xl text-gray-700 font-semibold"
            >
                {variable.name}
            </AnchorLink>
            {variable.type ? (
                <TypeName type={variable.type} />
            ) : (
                variable.kindString === 'Accessor' && variable.getSignature
            )}
            <div className="mt-2">
                <Comment comment={variable.comment} />
            </div>
        </div>
    );
}
