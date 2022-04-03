import PrecompiledMarkdown from './PrecompiledMarkdown';
import React from 'react';
import { JSONOutput } from 'typedoc';

type Props = {
    comment?: JSONOutput.Comment;
};

export default function Comment({ comment }: Props) {
    if (!comment || (!comment.shortTextMdx && !comment.textMdx)) {
        console.log(comment);
        return null;
    }

    return (
        <>
            {comment?.shortTextMdx && <PrecompiledMarkdown code={comment.shortTextMdx} />}
            {comment?.textMdx && <PrecompiledMarkdown code={comment.textMdx} />}
        </>
    );
}
