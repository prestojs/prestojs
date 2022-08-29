import { MDXProvider } from '@mdx-js/react';
import { generateId, mdxComponents, OnThisPage, PageSection } from '@prestojs/doc';
import React from 'react';
import { renderToString } from 'react-dom/server';

type Props = {
    children: React.ReactNode;
};

function extractHeadings(children) {
    const inPageLinks: PageSection[] = [];
    let section: null | PageSection = null;
    const extractHeading = heading => props => {
        const title = props.children;
        const anchorId = generateId(title);
        if (heading === 'h2') {
            if (section) {
                inPageLinks.push(section);
            }
            section = {
                title,
                showEmpty: true,
                anchorId,
                links: [],
            };
        }
        if (heading === 'h3') {
            if (!section) {
                section = {
                    anchorId: inPageLinks.length === 0 ? 'main-content' : anchorId,
                    title: title,
                    showEmpty: true,
                    links: [],
                };
            }
            section.links.push({
                title: title,
                anchorId,
                links: [],
            });
        }
        return <div />;
    };
    renderToString(
        <MDXProvider
            components={{
                h2: extractHeading('h2'),
                h3: extractHeading('h3'),
            }}
        >
            {children}
        </MDXProvider>
    );
    if (section) {
        inPageLinks.push(section);
    }
    return inPageLinks;
}

export default function MdxPage({ children }: Props) {
    const sections = extractHeadings(children);
    return (
        <>
            <MDXProvider components={mdxComponents}>
                <div className={`mdx ${sections.length > 0 ? 'xl:mr-[19.5rem]' : ''} `}>
                    {children}
                </div>
            </MDXProvider>
            {sections.length > 0 && <OnThisPage sections={sections} />}
        </>
    );
}
