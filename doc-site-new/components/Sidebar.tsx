import cx from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

function isCurrent(router, href) {
    if (!href.endsWith('/')) {
        href += '/';
    }
    let { asPath } = router;
    if (!asPath.endsWith('/')) {
        asPath += '/';
    }
    return asPath.startsWith(href);
}

function NavItem({ href, children, as }) {
    const router = useRouter();
    return (
        <Link href={href} as={as}>
            <a
                className={`block px-2 -mx-2 py-1 hover:text-gray-900 font-medium text-gray-600${
                    isCurrent(router, href || as)
                        ? 'font-bold bg-gray-200 active-top-level-menu'
                        : ''
                }`}
            >
                {children}
            </a>
        </Link>
    );
}

function Links({ links }) {
    const router = useRouter();
    const sortedLinks = links.map(l => l.as || l.href);
    sortedLinks.sort((a, b) => {
        if (a.length > b.length) return 1;
        if (a.length < b.length) return -1;
        return 0;
    });
    let activeLink = '';
    for (const link of sortedLinks) {
        if (isCurrent(router, link)) {
            activeLink = link;
        }
    }
    return links.map((m, i) => {
        const active = activeLink === (m.as || m.href);
        return (
            <li key={i}>
                <Link href={m.href} as={m.as}>
                    <a
                        className={cx('hover:underline text-gray-800', { current: active })}
                        {...(active ? { 'aria-current': 'page' } : {})}
                    >
                        {m.title}
                    </a>
                </Link>
            </li>
        );
    });
}

function LinksSection_({ title, links }) {
    const router = useRouter();
    const anyActive = links.filter(({ href, as }) => isCurrent(router, as || href)).length > 0;
    return (
        <div className="mb-8">
            {title && (
                <h5
                    className={`mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-sm lg:text-xs${
                        anyActive ? ' current-section' : ''
                    }`}
                >
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
    const router = useRouter();
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
    const anyActiveDefault =
        defaultSection.filter(({ href, as }) => isCurrent(router, as || href)).length > 0;
    return (
        <>
            <h5
                className={`mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-md lg:text-sm${
                    anyActiveDefault ? ' current-section' : ''
                }`}
            >
                {title}
            </h5>
            {defaultSection.length > 0 && <LinksSection_ links={defaultSection} />}
            {sections.map((section, i) => (
                <LinksSection_ key={i} title={section.title} links={section.items} />
            ))}
        </>
    );
}

export default function Sidebar({ children, currentTitle, links, id }) {
    return (
        <div className="hidden fixed inset-0 h-full bg-white z-90 w-full border-b -mb-16 lg:-mb-0 lg:static lg:h-auto lg:overflow-y-visible lg:border-b-0 lg:pt-0 lg:w-1/4 lg:block lg:border-0 xl:w-1/5 mr-10">
            <div className="max-h-screen h-full overflow-y-auto scrolling-touch lg:h-auto lg:block lg:relative lg:sticky lg:top-16 bg-white lg:bg-transparent">
                <nav
                    id={id}
                    className="px-6 overflow-y-auto text-base lg:text-sm lg:pl-6 lg:pr-8 sticky?lg:h-(screen-16)"
                >
                    {currentTitle && (
                        <h5 className="mb-3 lg:mb-2 text-gray-500 uppercase tracking-wide font-bold text-md lg:text-sm">
                            {currentTitle}
                        </h5>
                    )}
                    {links && (
                        <div className="mb-10">
                            {links.map(l =>
                                l.heading ? (
                                    <div
                                        key={l.heading}
                                        className="py-1 my-2 text-md font-medium border-b-2"
                                    >
                                        {l.heading}
                                    </div>
                                ) : (
                                    <NavItem key={l.href} href={l.href} as={l.as}>
                                        {l.title}
                                    </NavItem>
                                )
                            )}
                        </div>
                    )}
                    {children}
                </nav>
            </div>
        </div>
    );
}

Sidebar.LinksSection = LinksSection;
