import { generateId } from '@prestojs/doc/AnchorLink';
import { useOnThisPageSections } from '@prestojs/doc/OnThisPageProvider';
import React, { ReactNode } from 'react';

export function OnThisPageSection({
    title,
    titleId,
    links,
}: {
    title: ReactNode;
    titleId?: string;
    links: { title: ReactNode; id: string }[];
}) {
    return (
        <>
            <li className="block py-1 font-medium hover:text-cyan-600 text-cyan-500">
                <a href={`#${titleId || generateId(title)}`}>{title}</a>
            </li>
            {links.map(({ title, id }, i) => (
                <li className="block py-1 font-medium hover:text-gray-900" key={i}>
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

export default function OnThisPage() {
    const { sections } = useOnThisPageSections();
    if (sections.length === 0) {
        return null;
    }
    return (
        <div className="fixed z-20 top-16 bottom-0 right-[max(0px,calc(50%-45rem))] w-[19.5rem] py-10 px-8 overflow-y-auto hidden xl:block">
            <h5 className="text-gray-800 font-semibold mb-4 text-sm">On this page</h5>
            <ul className="text-gray-700 text-sm leading-6">
                {sections.map((section, i) => (
                    <OnThisPageSection key={i} title={section.title} links={section.links} />
                ))}
            </ul>
        </div>
    );
}
