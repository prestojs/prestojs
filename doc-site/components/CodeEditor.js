import React from 'react';
import { ActionButtons, Compiler, Editor, Error, formatCode, useView } from 'react-view';
import { liveEditorTheme } from '../prismTheme';

const editorClass = '-ml-10 -mr-10 p-4 bg-gray-100 mt-10 mb-10';

export default function CodeEditor({ children, scope, horizontal }) {
    const params = useView({
        initialCode: formatCode(children || ''),
        scope,
    });
    if (horizontal) {
        return (
            <div className={`flex ${editorClass}`}>
                <div className="mr-5 flex-1">
                    <Editor {...params.editorProps} language="jsx" theme={liveEditorTheme} />
                    <ActionButtons {...params.actions} />
                </div>
                <div className="flex-1 code-editor-compiler">
                    <Compiler {...params.compilerProps} className="block" />
                    <Error {...params.errorProps} />
                </div>
            </div>
        );
    }
    return (
        <div className={editorClass}>
            <div className="code-editor-compiler">
                <Compiler {...params.compilerProps} />
            </div>
            <Editor {...params.editorProps} language="jsx" theme={liveEditorTheme} />
            <Error {...params.errorProps} />
            <ActionButtons {...params.actions} />
        </div>
    );
}
