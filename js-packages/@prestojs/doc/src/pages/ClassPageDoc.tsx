import AnchorLink, { generateId } from '@prestojs/doc/AnchorLink';
import ApiPreferencesBar from '@prestojs/doc/components/ApiPreferencesBar';
import Description from '@prestojs/doc/components/Description';
import FunctionDocumentation from '@prestojs/doc/components/FunctionDocumentation';
import OnThisPage from '@prestojs/doc/components/OnThisPage';
import { usePreferences } from '@prestojs/doc/components/PreferencesProvider';
import { ClassPage, PageMetaData } from '@prestojs/doc/newTypes';
import React from 'react';
import PageHeader from '../components/PageHeader';
import Variable from '../components/Variable';

type Props = {
    page: ClassPage;
    meta: PageMetaData;
};

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <AnchorLink
            component="h3"
            id={id || generateId(children)}
            className="group flex whitespace-pre-wrap text-md text-cyan-500 font-semibold"
        >
            {children}
        </AnchorLink>
    );
}

function Section({ title, children }) {
    if (!children) {
        return null;
    }
    return (
        <>
            <SectionHeading>{title}</SectionHeading>
            {children}
        </>
    );
}

function MethodDoc({ method }) {
    return (
        <div className="py-2">
            {method.signatures.map((sig, i) => (
                <FunctionDocumentation key={i} signature={sig} />
            ))}
        </div>
    );
}

export default function ClassPageDoc({ page, meta }: Props) {
    const { showInherited } = usePreferences();
    const showOnThisPage = page.pageSections.length > 0;
    const filterInherited = node => showInherited || !node.isInherited;
    const properties = page.properties.filter(filterInherited);
    const methods = page.methods.filter(filterInherited);
    const staticProperties = page.staticProperties.filter(filterInherited);
    const staticMethods = page.staticMethods.filter(filterInherited);
    return (
        <div>
            {showOnThisPage && <OnThisPage sections={page.pageSections} />}
            <div className={showOnThisPage ? 'xl:mr-[19.5rem]' : ''}>
                <PageHeader page={page} meta={meta} />
                <Description description={page.description} />
                <ApiPreferencesBar />
                {page.constructorDefinition && (
                    <>
                        <SectionHeading>Constructor</SectionHeading>
                        {page.constructorDefinition.signatures.map((sig, i) => (
                            <FunctionDocumentation
                                key={i}
                                signature={sig}
                                hideTypeParameters
                                hideReturnType
                            />
                        ))}
                    </>
                )}
                {methods.length > 0 && (
                    <Section title="Methods">
                        {methods.map(method => (
                            <MethodDoc method={method} />
                        ))}
                    </Section>
                )}
                {properties.length > 0 && (
                    <Section title="Properties">
                        {properties.map(prop => (
                            <Variable key={prop.name} variable={prop} />
                        ))}
                    </Section>
                )}
                {staticMethods.length > 0 && (
                    <Section title="Static Methods">
                        {staticMethods.map(method => (
                            <MethodDoc method={method} />
                        ))}
                    </Section>
                )}
                {staticProperties.length > 0 && (
                    <Section title="Static Properties">
                        {staticProperties.map(prop => (
                            <Variable key={prop.name} variable={prop} />
                        ))}
                    </Section>
                )}
            </div>
        </div>
    );
}
