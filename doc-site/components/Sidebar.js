import Link from 'next/link';
import React from 'react';

function NavItem({ href, children, as }) {
    return (
        <Link href={href} as={as}>
            <a className="block px-2 -mx-2 py-1 hover:text-gray-900 font-medium text-gray-600">
                {children}
            </a>
        </Link>
    );
}

function Links({ links }) {
    return links.map((m, i) => (
        <li key={i}>
            <Link href={m.href} as={m.as}>
                <a className="hover:underline text-gray-800">{m.title}</a>
            </Link>
        </li>
    ));
}

function LinksSection_({ title, links }) {
    return (
        <div className="mb-8">
            {title && (
                <h5 className="mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-sm lg:text-xs">
                    {title}
                </h5>
            )}
            <ul>
                <Links links={links} />
            </ul>
        </div>
    );
}

/**
 * Section of links. Can contain sub sections. Valid shape:
 *
 * Grouped:
 *
 * ```
 * [
 * // These are not nested under a sub section
 *   {
 *      "isDefault": true,
 *      "items": [
 *          ....
 *      ]
 *    },
 *   {
 *      "title": "Sub Section 1",
 *      "items": [
 *          ...
 *      ]
 *    },
 *   {
 *      "title": "Sub Section 2",
 *      "items": [
 *          ...
 *      ]
 *    }
 *   ]
 * ```
 *
 *  Or flat
 *
 *  ```
 *  [
 *   {
 *      "title": "ApiError",
 *      "href": "/docs/[...slug]/",
 *      "as": "/docs/rest/ApiError/"
 *   },
 *   {
 *      "title": "Endpoint",
 *      "href": "/docs/[...slug]/",
 *      "as": "/docs/rest/Endpoint/"
 *    },
 *  ]
 *  ```
 */
function LinksSection({ title, links }) {
    const defaultSection = [];
    const sections = [];
    for (const linkOrSection of links) {
        if (linkOrSection.items) {
            if (linkOrSection.isDefault) {
                defaultSection.push(...linkOrSection.items);
            } else {
                sections.push(linkOrSection);
            }
        } else {
            defaultSection.push(linkOrSection);
        }
    }
    return (
        <>
            <h5 className="mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-md lg:text-sm">
                {title}
            </h5>
            {defaultSection.length > 0 && <LinksSection_ links={defaultSection} />}
            {sections.map((section, i) => (
                <LinksSection_ key={i} title={section.title} links={section.items} />
            ))}
        </>
    );
}

export default function Sidebar({ children, links }) {
    return (
        <div
            id="sidebar"
            className="hidden fixed inset-0 pt-16 h-full bg-white z-90 w-full border-b -mb-16 lg:-mb-0 lg:static lg:h-auto lg:overflow-y-visible lg:border-b-0 lg:pt-0 lg:w-1/4 lg:block lg:border-0 xl:w-1/5"
        >
            <div
                id="navWrapper"
                className="h-full overflow-y-auto scrolling-touch lg:h-auto lg:block lg:relative lg:sticky lg:top-16 bg-white lg:bg-transparent"
            >
                <nav
                    id="nav"
                    className="px-6 pt-6 overflow-y-auto text-base lg:text-sm lg:py-12 lg:pl-6 lg:pr-8 sticky?lg:h-(screen-16)"
                >
                    <div className="mb-10">
                        {links &&
                            links.map(l => (
                                <NavItem key={l.href} href={l.href} as={l.as}>
                                    {l.title}
                                </NavItem>
                            ))}
                    </div>
                    {children}
                </nav>
            </div>
        </div>
    );
}

Sidebar.LinksSection = LinksSection;
