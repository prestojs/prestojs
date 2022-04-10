import { FunctionPage, PageMetaData } from '@prestojs/doc/newTypes';
import React from 'react';
import FunctionDocumentation from '../components/FunctionDocumentation';
import PageHeader from '../components/PageHeader';

type Props = {
    page: FunctionPage;
    meta: PageMetaData;
};

export default function FunctionPageDoc({ page, meta }: Props) {
    console.log(page);
    return (
        <div>
            <PageHeader page={page} meta={meta} />
            {page.signatures.map((sig, i) => (
                <FunctionDocumentation key={i} signature={sig} />
            ))}
        </div>
    );
}
