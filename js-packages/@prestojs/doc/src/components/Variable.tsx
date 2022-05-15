import React from 'react';
import { VariableNode } from '../newTypes';
import AnchorLink from './AnchorLink';
import Description from './Description';
import SourceLink from './SourceLink';
import Type from './Type';

export default function Variable({ variable }: { variable: VariableNode }) {
    if (variable.name === 'responseIsSet') {
        console.log(variable);
    }
    return (
        <div className="border-t-2 border-gray-200 mt-3 pt-3">
            <div className="flex justify-between">
                <AnchorLink
                    id={variable.anchorId}
                    component="h4"
                    className="text-xl text-gray-700 font-semibold"
                >
                    {variable.name}
                </AnchorLink>
                <SourceLink sourceLocation={variable.sourceLocation} />
            </div>
            <Type type={variable.type} />
            <div className="mt-2">
                <Description description={variable.description} />
            </div>
        </div>
    );
}
