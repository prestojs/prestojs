import React from 'react';
import { JSONOutput } from 'typedoc';
import PrecompiledMarkdown from './PrecompiledMarkdown';

type Props = {
    comment?: JSONOutput.Comment;
};

export default function Comment({ comment }: Props) {
    if (!comment || (!comment.shortTextMdx && !comment.textMdx)) {
        return null;
    }

    return (
        <>
            {comment?.shortTextMdx && <PrecompiledMarkdown code={comment.shortTextMdx} />}
            {comment?.textMdx && <PrecompiledMarkdown code={comment.textMdx} />}
        </>
    );
}
