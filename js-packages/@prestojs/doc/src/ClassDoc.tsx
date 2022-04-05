import React, { useMemo } from 'react';
import ApiPreferencesBar from './ApiPreferencesBar';
import ClassDetails from './ClassDetails';
import Comment from './Comment';
import DocHeader from './DocHeader';
import { usePreferences } from './PreferencesProvider';
import TypeArgumentsProvider from './TypeArgumentsProvider';
import { DocNode } from './types';
import { getClassDetails } from './util';

type Props = {
    node: DocNode;
};

export default function ClassDoc({ node }: Props) {
    const { declaration } = node;
    const { children } = declaration;
    const { showInherited } = usePreferences();
    if (!children) {
        throw new Error('Missing values for class doc');
    }
    const classDetails = useMemo(
        () => getClassDetails({ children }, showInherited),
        [children, showInherited]
    );

    return (
        <TypeArgumentsProvider declaration={declaration}>
            <DocHeader node={node} />
            <Comment comment={declaration.comment} />
            <hr className="my-5" />
            <ApiPreferencesBar />
            <ClassDetails classDetails={classDetails} />
        </TypeArgumentsProvider>
    );
}
