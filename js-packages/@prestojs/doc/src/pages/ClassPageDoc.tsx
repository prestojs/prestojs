import React from 'react';
import AnchorLink, { generateId } from '../components/AnchorLink';
import ApiPreferencesBar from '../components/ApiPreferencesBar';
import CodeExamples from '../components/CodeExamples';
import Description from '../components/Description';
import FunctionDocumentation from '../components/FunctionDocumentation';
import OnThisPage from '../components/OnThisPage';
import PageHeader from '../components/PageHeader';
import PrecompiledMarkdown from '../components/PrecompiledMarkdown';
import { usePreferences } from '../components/PreferencesProvider';
import Type from '../components/Type';
import Variable from '../components/Variable';
import { ClassPage, MethodType, PageMetaData } from '../newTypes';

type Props = {
    page: ClassPage;
    meta?: PageMetaData;
    isNested?: boolean;
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

export function Section({ title, children }) {
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

function MethodDoc({ method }: { method: MethodType }) {
    return (
        <div className="py-2">
            {method.overloadPreamble ? (
                <>
                    <div className="flex items-center justify-between mb-5">
                        <AnchorLink component="div" id={method.signatures[0].anchorId}>
                            <div className="text-xl text-gray-700 font-semibold">
                                <span className="font-bold">{method.name}</span>
                                <span className="text-gray-500">(...)</span>
                            </div>
                        </AnchorLink>
                    </div>
                    <PrecompiledMarkdown code={method.overloadPreamble} />
                    <div className="pl-5 border-l">
                        <p className="mb-5 italic underline text-lg">
                            Documentation for each typescript overload shown below:
                        </p>
                        {method.signatures.map((sig, i) => (
                            <FunctionDocumentation key={i} signature={sig} />
                        ))}
                    </div>
                </>
            ) : (
                method.signatures.map((sig, i) => <FunctionDocumentation key={i} signature={sig} />)
            )}
        </div>
    );
}

function ClassHierarchy({ page }: { page: ClassPage }) {
    if (page.hierarchy.parent == null && page.hierarchy.children.length == 0) {
        return null;
    }
    return (
        <div className="mb-3 mt-3 bg-sky-50 p-2 rounded text-gray-800">
            <div className="font-semibold font-lg">Hierarchy</div>
            <ul className="ml-5">
                {page.hierarchy.parent && (
                    <li className="list-disc">
                        <Type type={page.hierarchy.parent} />
                        {page.hierarchy.typeArguments && (
                            <span>
                                &lt;
                                {page.hierarchy.typeArguments.map((t, i) => (
                                    <span className="text-gray-500" key={i}>
                                        <Type type={t} mode="COMPACT" />
                                        {page.hierarchy.typeArguments &&
                                            i < page.hierarchy.typeArguments.length - 1 && (
                                                <span className="text-gray-300 mr-1">,</span>
                                            )}
                                    </span>
                                ))}
                                &gt;
                            </span>
                        )}
                    </li>
                )}
                <li
                    className={`list-disc font-semibold ${page.hierarchy.parent ? 'ml-5' : 'ml-0'}`}
                >
                    {page.name}
                </li>
                {page.hierarchy.children.length > 0 && (
                    <>
                        {page.hierarchy.children.map((child, i) => (
                            <li
                                key={i}
                                className={`list-disc ${page.hierarchy.parent ? 'ml-10' : 'ml-5'}`}
                            >
                                <Type type={child} />
                            </li>
                        ))}
                    </>
                )}
            </ul>
        </div>
    );
}

export default function ClassPageDoc({ page, meta, isNested = false }: Props) {
    const { showInherited } = usePreferences();
    const showOnThisPage = page.pageSections.length > 0 && !isNested;
    const filterInherited = node => showInherited || !node.isInherited;
    const filterInheritedMethod = node => showInherited || !node.signatures?.[0]?.isInherited;
    const properties = page.properties.filter(filterInherited);
    const methods = page.methods.filter(filterInheritedMethod);
    const staticProperties = page.staticProperties.filter(filterInherited);
    const staticMethods = page.staticMethods.filter(filterInheritedMethod);
    return (
        <div>
            {showOnThisPage && <OnThisPage sections={page.pageSections} />}
            <div className={showOnThisPage ? 'xl:mr-[19.5rem]' : ''}>
                {meta && <PageHeader page={page} meta={meta} />}
                {!isNested && <ClassHierarchy page={page} />}
                <Description description={page.description} />
                {meta?.examples && <CodeExamples examples={meta.examples} />}
                {!isNested && <ApiPreferencesBar classPage={page} />}
                {page.constructorDefinition && !page.hideConstructor && (
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
