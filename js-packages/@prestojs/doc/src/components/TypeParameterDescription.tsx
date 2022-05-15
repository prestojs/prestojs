import React from 'react';
import { TypeParameter } from '../newTypes';
import Description from './Description';
import Tooltip from './Tooltip';
import Type from './Type';

export default function TypeParameterDescription({
    typeParameter,
}: {
    typeParameter: TypeParameter;
}) {
    return (
        <span className="text-gray-500">
            {typeParameter.description?.short || typeParameter.description?.long ? (
                <Tooltip
                    className="underline decoration-dotted"
                    content={
                        <>
                            <Description description={typeParameter.description} />
                            {typeParameter.default && (
                                <>
                                    Defaults to <Type type={typeParameter.default} />
                                </>
                            )}
                        </>
                    }
                >
                    {typeParameter.name}
                </Tooltip>
            ) : (
                typeParameter.name
            )}
            {typeParameter.default && (
                <>
                    {' '}
                    = <Type type={typeParameter.default} />
                </>
            )}
        </span>
    );
}
