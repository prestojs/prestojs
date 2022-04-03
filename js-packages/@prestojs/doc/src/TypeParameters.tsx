import React from 'react';
import { JSONOutput } from 'typedoc';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import Tooltip from './Tooltip';
import TypeName from './TypeName';

export default function TypeParameters({
    typeParameter,
}: {
    typeParameter: JSONOutput.TypeParameterReflection[];
}) {
    return (
        <span>
            &lt;
            {typeParameter.map((t, i) => (
                <span className="text-gray-500" key={t.name}>
                    {t.comment?.shortTextMdx || t.comment?.textMdx ? (
                        <Tooltip
                            className="underline decoration-dotted"
                            content={
                                <>
                                    {t.comment?.shortTextMdx && (
                                        <PrecompiledMarkdown code={t.comment?.shortTextMdx} />
                                    )}
                                    {t.comment?.textMdx && (
                                        <PrecompiledMarkdown code={t.comment?.textMdx} />
                                    )}
                                    {t.default && (
                                        <>
                                            Defaults to <TypeName type={t.default} />
                                        </>
                                    )}
                                </>
                            }
                        >
                            {t.name}
                        </Tooltip>
                    ) : (
                        t.name
                    )}
                    {t.default && (
                        <>
                            {' '}
                            = <TypeName type={t.default} />
                        </>
                    )}
                    {i < typeParameter.length - 1 && <span className="text-gray-300 mr-1">,</span>}
                </span>
            ))}
            &gt;
        </span>
    );
}
