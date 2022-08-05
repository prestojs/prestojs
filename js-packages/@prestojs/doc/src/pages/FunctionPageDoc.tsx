import React from 'react';
import CodeExamples from '../components/CodeExamples';
import FunctionDocumentation from '../components/FunctionDocumentation';
import OnThisPage from '../components/OnThisPage';
import PageHeader from '../components/PageHeader';
import { FunctionPage, PageMetaData } from '../newTypes';

type Props = {
    page: FunctionPage;
    meta: PageMetaData;
};

export default function FunctionPageDoc({ page, meta }: Props) {
    const showOnThisPage = page.pageSections.length > 0;
    return (
        <div>
            {showOnThisPage && <OnThisPage sections={page.pageSections} />}
            <div className={showOnThisPage ? 'xl:mr-[19.5rem]' : ''}>
                <PageHeader page={page} meta={meta} />
                {page.signatures.map((sig, i) => (
                    <FunctionDocumentation key={i} signature={sig} />
                ))}
                {meta.examples && <CodeExamples examples={meta.examples} />}
            </div>
        </div>
    );
}
