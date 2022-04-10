import Description from '@prestojs/doc/components/Description';
import { TypeParameter } from '@prestojs/doc/newTypes';
import React from 'react';
import Tooltip from './Tooltip';
import Type from './Type';

export default function TypeParameters({ typeParameters }: { typeParameters: TypeParameter[] }) {
    return (
        <span>
            &lt;
            {typeParameters.map((t, i) => (
                <span className="text-gray-500" key={t.name}>
                    {t.description?.short || t.description?.long ? (
                        <Tooltip
                            className="underline decoration-dotted"
                            content={
                                <>
                                    <Description description={t.description} />
                                    {t.default && (
                                        <>
                                            Defaults to <Type type={t.default} />
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
                            = <Type type={t.default} />
                        </>
                    )}
                    {i < typeParameters.length - 1 && <span className="text-gray-300 mr-1">,</span>}
                </span>
            ))}
            &gt;
        </span>
    );
}
