import React from 'react';
import AnchorLink from './AnchorLink';
import CodeBlock from './CodeBlock';
import CodeEditor from './CodeEditor';

export default {
    /*View,*/ p: props => <p {...props} className="mt-6" />,
    CodeEditor,
    code: CodeBlock,
    h2: props => {
        if (typeof props.children != 'string') {
            return <h2 {...props} />;
        }
        const id = props.children.replace(/ /g, '_');
        return <AnchorLink {...props} Component="h2" id={id} className="text-3xl font-bold my-4" />;
    },
};
