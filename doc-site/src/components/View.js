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
import styled from 'styled-components';
import { liveEditorTheme } from '../prismTheme';
import LiveCodeContainer from './LiveCodeContainer';

export { PropTypes };

const CompilerContainer = styled.div`
    > div > div {
        // react-view doesn't allow you to customise styles - resort to specific targeting
        // to override the defaults
        display: block !important;
    }
`;

export default function View({ componentName, componentProps, scope, imports }) {
    const params = useView({
        componentName,
        props: componentProps,
        scope,
        imports,
    });
    return (
        <LiveCodeContainer>
            <CompilerContainer>
                <Compiler {...params.compilerProps} minHeight={62} placeholder={Placeholder} />
            </CompilerContainer>
            <Error msg={params.errorProps.msg} isPopup />
            <Knobs {...params.knobProps} />
            <Editor {...params.editorProps} theme={liveEditorTheme} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </LiveCodeContainer>
    );
}

// I exposed this globally as I could get extra scope through to MDX. If I pass it on the `scope` param to
// MDXRenderer this seems to remove all imports done in the .mdx file itself... and passing it in MDXProvider
// components didn't work. Importing directly also had issues... not sure why.
if (typeof window !== 'undefined') {
    window.PropTypes = PropTypes;
}
