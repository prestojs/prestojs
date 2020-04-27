import React from 'react';
import { useView, Compiler, Editor, Error, ActionButtons } from 'react-view';
import { liveEditorTheme } from '../prismTheme';

const editorClass = '-ml-10 -mr-10 p-4 bg-gray-100 mt-10 mb-10';

export default function CodeEditor({ children, scope, horizontal }) {
    const params = useView({
        initialCode: children,
        scope,
    });
    if (horizontal) {
        return (
            <div className={`flex ${editorClass}`}>
                <div style={{ maxWidth: '50%' }} className="mr-5">
                    <Editor {...params.editorProps} language="jsx" theme={liveEditorTheme} />
                    <ActionButtons {...params.actions} />
                </div>
                <div className="flex-1">
                    <Compiler {...params.compilerProps} className="block" />
                    <Error {...params.errorProps} />
                </div>
            </div>
        );
    }
    return (
        <div className={editorClass}>
            <Compiler {...params.compilerProps} />
            <Editor {...params.editorProps} language="jsx" theme={liveEditorTheme} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </div>
    );
}
