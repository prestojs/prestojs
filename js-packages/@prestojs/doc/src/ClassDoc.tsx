import React from 'react';
import { generateId } from './AnchorLink';
import ClassDetails from './ClassDetails';
import Comment from './Comment';
import DocHeader from './DocHeader';
import { DocNode } from './types';
import { getClassDetails } from './util';

type Props = {
    node: DocNode;
};

function OnThisPageSection({ title, links }) {
    if (links.length === 0) {
        return null;
    }
    return (
        <>
            <li className="block py-1 font-medium hover:text-cyan-600 text-cyan-500">
                <a href={`#${generateId(title)}`}>{title}</a>
            </li>
            {links.map(({ title, id }) => (
                <li className="block py-1 font-medium hover:text-gray-900" key={id}>
                    <a href={`#${id}`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline text-gray-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>{' '}
                        {title}
                    </a>
                </li>
            ))}
        </>
    );
}

function OnThisPage({ classDetails }: { classDetails: ReturnType<typeof getClassDetails> }) {
    return (
        <div className="fixed z-20 top-16 bottom-0 right-[max(0px,calc(50%-45rem))] w-[19.5rem] py-10 px-8 overflow-y-auto hidden xl:block">
            <h5 className="text-gray-800 font-semibold mb-4 text-sm">On this page</h5>
            <ul className="text-gray-700 text-sm leading-6">
                {classDetails.constructor?.signatures && (
                    <OnThisPageSection
                        title="Constructor"
                        links={[
                            {
                                title: classDetails.constructor.signatures[0].name,
                                id: classDetails.constructor.signatures[0].anchorId,
                            },
                        ]}
                    />
                )}
                <OnThisPageSection
                    title="Methods"
                    links={classDetails.methods.map(method => ({
                        id: method.signatures?.[0].anchorId,
                        title: method.name,
                    }))}
                />
                <OnThisPageSection
                    title="Static Methods"
                    links={classDetails.staticMethods.map(method => ({
                        id: method.signatures?.[0].anchorId,
                        title: method.name,
                    }))}
                />
                <OnThisPageSection
                    title="Properties"
                    links={classDetails.properties.map(prop => ({
                        id: prop.anchorId,
                        title: prop.name,
                    }))}
                />
                <OnThisPageSection
                    title="Static Properties"
                    links={classDetails.staticProperties.map(prop => ({
                        id: prop.anchorId,
                        title: prop.name,
                    }))}
                />
            </ul>
        </div>
    );
}

export default function ClassDoc({ node }: Props) {
    const { declaration } = node;
    const { children, groups, typeParameter } = declaration;
    if (!children || !groups) {
        throw new Error('Missing values for class doc');
    }

    const classDetails = getClassDetails({ children, groups });
    return (
        <>
            <div className="xl:mr-[19.5rem]">
                <DocHeader node={node} />
                <Comment comment={declaration.comment} />
                <ClassDetails {...classDetails} />
            </div>
            <OnThisPage classDetails={classDetails} />
        </>
    );
}
