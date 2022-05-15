import React from 'react';
import CodeExamples from '../components/CodeExamples';
import FunctionDocumentation from '../components/FunctionDocumentation';
import PageHeader from '../components/PageHeader';
import { FunctionPage, PageMetaData } from '../newTypes';

type Props = {
    page: FunctionPage;
    meta: PageMetaData;
};

export default function FunctionPageDoc({ page, meta }: Props) {
    return (
        <div>
            <PageHeader page={page} meta={meta} />
            {page.signatures.map((sig, i) => (
                <FunctionDocumentation key={i} signature={sig} />
            ))}
            {meta.examples && <CodeExamples examples={meta.examples} />}
        </div>
    );
}
