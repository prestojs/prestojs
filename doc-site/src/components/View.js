import React from 'react';
import { useView, Compiler, Knobs, Editor, Error, ActionButtons, Placeholder } from 'react-view';

export default function View({ componentName, stuff, scope, imports }) {
    const params = useView({
        componentName,
        props: stuff,
        scope,
        imports,
    });

    return (
        <React.Fragment>
            <Compiler {...params.compilerProps} minHeight={62} placeholder={Placeholder} />
            <Error msg={params.errorProps.msg} isPopup />
            <Knobs {...params.knobProps} />
            <Editor {...params.editorProps} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </React.Fragment>
    );
}
