import React from 'react';
import AnchorLink from './AnchorLink';
import CodeBlock from './CodeBlock';
import CodeEditor from './CodeEditor';

const InfoBox = props => {
    return <blockquote {...props} className="info-box" />;
};

export default {
    /*View,*/ p: props => <p {...props} className="mt-6" />,
    CodeEditor,
    code: CodeBlock,
    blockquote: props => {
        if (Array.isArray(props.children)) {
            // If blockquote starts with INFO, eg.
            // > INFO
            // > More content
            // Render it using InfoBox
            if (props.children[0].props.children[0] === 'INFO\n') {
                return (
                    <InfoBox {...props}>
                        {[
                            React.cloneElement(
                                props.children[0],
                                props.children[0].props,
                                ...props.children[0].props.children.slice(1)
                            ),
                            ...props.children.slice(1),
                        ]}
                    </InfoBox>
                );
            }
        }
        return <blockquote {...props} className="notification-box" />;
    },
    InfoBox,
    h2: props => {
        if (typeof props.children != 'string') {
            return <h2 {...props} />;
        }
        const id = props.children.replace(/ /g, '_');
        return <AnchorLink {...props} Component="h2" id={id} className="text-3xl font-bold my-4" />;
    },
};
