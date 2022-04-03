import { useDocContext } from '@prestojs/doc/DocProvider';
import React from 'react';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import { DeclarationReflection } from './types';

export default function DeclarationDescription({
    declaration,
}: {
    declaration: DeclarationReflection;
}) {
    const context = useDocContext();
    const { referencedTypes = {} } = context || {};
    let { comment } = declaration;
    if (!comment && declaration.signatures?.length) {
        comment = declaration.signatures[0].comment;
    }
    if (!comment && context && declaration.type?.type === 'reference' && declaration.type.id) {
        comment = referencedTypes[declaration.type.id]?.comment;
    }
    return (
        <>
            {comment?.shortTextMdx && <PrecompiledMarkdown code={comment?.shortTextMdx} />}
            {comment?.textMdx && <PrecompiledMarkdown code={comment?.textMdx} />}
            {declaration.docFlags.deprecated && (
                <div className="text-red-400 flex">
                    <strong className="mr-1">
                        Deprecated{typeof declaration.docFlags.deprecated == 'string' && ': '}
                    </strong>
                    {typeof declaration.docFlags.deprecated == 'string' && (
                        <PrecompiledMarkdown code={declaration.docFlags.deprecated} />
                    )}
                </div>
            )}
        </>
    );
}
