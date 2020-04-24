import React from 'react';
import {
    PropTypes,
    useView,
    Compiler,
    Knobs,
    Editor,
    Error,
    ActionButtons,
    Placeholder,
} from 'react-view';
import { liveEditorTheme } from '../prismTheme';

export { PropTypes };

export default function View({ componentName, componentProps, scope, imports }) {
    const params = useView({
        componentName,
        props: componentProps,
        scope,
        imports,
    });
    return (
        <div className="-ml-10 -mr-10 p-4 bg-gray-100 mt-10 mb-10">
            <Compiler
                {...params.compilerProps}
                minHeight={62}
                placeholder={Placeholder}
                className="block"
            />
            <Error msg={params.errorProps.msg} isPopup />
            <Knobs {...params.knobProps} />
            <Editor {...params.editorProps} theme={liveEditorTheme} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </div>
    );
}

// I exposed this globally as I could get extra scope through to MDX. If I pass it on the `scope` param to
// MDXRenderer this seems to remove all imports done in the .mdx file itself... and passing it in MDXProvider
// components didn't work. Importing directly also had issues... not sure why.
if (typeof window !== 'undefined') {
    window.PropTypes = PropTypes;
}
