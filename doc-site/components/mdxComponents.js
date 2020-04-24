import React from 'react';
import CodeBlock from './CodeBlock';
import CodeEditor from './CodeEditor';

export default {
    /*View,*/ p: props => <p {...props} className="mt-6" />,
    CodeEditor,
    code: CodeBlock,
};
