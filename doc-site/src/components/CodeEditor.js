import React from 'react';
import { useView, Compiler, Editor, Error, ActionButtons } from 'react-view';
import { liveEditorTheme } from '../prismTheme';
import LiveCodeContainer from './LiveCodeContainer';

export default function CodeEditor({ children, scope }) {
    const params = useView({
        initialCode: children,
        scope,
    });
    return (
        <LiveCodeContainer>
            <Compiler {...params.compilerProps} />
            <Editor {...params.editorProps} language="jsx" theme={liveEditorTheme} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </LiveCodeContainer>
    );
}
