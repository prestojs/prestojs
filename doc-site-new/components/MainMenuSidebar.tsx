import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import _menuByName from '../data/apiMenu.json';

const menuByName = _menuByName as Record<
    string,
    {
        items: {
            title: string;
            href: string;
        }[];
        isDefault?: boolean;
        title?: string;
    }[]
>;

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

function NavItem({ href, children, as }: { href: string; children: React.ReactNode; as?: string }) {
    return (
        <Link href={href} as={as}>
            <a className="flex items-center lg:text-sm lg:leading-6 mb-1 font-semibold text-gray-700 hover:text-gray-900">
                {children}
            </a>
        </Link>
    );
}

function SubNavItem({ href, children, as }) {
    const router = useRouter();
    return (
        <Link href={href} as={as}>
            <a
                className={`block border-l pl-2 py-0.5 border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-900 ${
                    isCurrent(router, href || as)
                        ? 'text-cyan-500 hover:text-cyan-600 font-bold'
                        : ''
                }`}
            >
                {children}
            </a>
        </Link>
    );
}

const packageLinks = [
    { href: '/docs/viewmodel', title: 'View Model', packageName: 'viewmodel' },
    { href: '/docs/final-form', title: 'Final Form', packageName: 'final-form' },
    { href: '/docs/rest', title: 'REST', packageName: 'rest' },
    { href: '/docs/routing', title: 'Routing', packageName: 'routing' },
    { href: '/docs/ui', title: 'UI', packageName: 'ui' },
    { href: '/docs/ui-antd', title: 'UI ANTD', packageName: 'ui-antd' },
    { href: '/docs/util', title: 'Util', packageName: 'util' },
];

export default function MainMenuSidebar({
    className,
    forceOpen = false,
    onCloseMenu,
}: {
    className?: string;
    forceOpen?: boolean;
    onCloseMenu: () => void;
}) {
    const router = useRouter();
    const currentPackageName = router.asPath.split('/').filter(Boolean).slice(1).shift() as string;
    const currentMenu = menuByName[currentPackageName];
    className = `lg:block fixed z-50 inset-0 right-auto pb-10 px-8 overflow-y-auto ${className} bg-white`;
    if (!forceOpen) {
        className += ' hidden';
    }
    return (
        <>
            <div className={className}>
                <button
                    onClick={() => onCloseMenu()}
                    className="text-gray-400 absolute right-2 top-2 hover:text-gray-500 lg:hidden"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <nav id="nav" className="lg:text-sm lg:leading-6 relative">
                    <ul>
                        <li className="pb-2">
                            <NavItem href="/docs/guide">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                                Getting Started
                            </NavItem>
                        </li>
                        <li className="pb-2">
                            <NavItem href="/docs/tutorial">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                </svg>
                                Tutorial
                            </NavItem>
                        </li>
                        <li className="mb-2 font-semibold text-gray-600 border-b">
                            <div className="font-extrabold my-2">Packages</div>
                        </li>
                        {packageLinks.map(link => (
                            <li key={link.href}>
                                <NavItem href={link.href}>{link.title}</NavItem>
                                {link.packageName === currentPackageName && (
                                    <ul>
                                        {currentMenu?.map((menu, i) => (
                                            <React.Fragment key={i}>
                                                {!menu.isDefault && (
                                                    <li className="ml-2 font-bold py-2">
                                                        {menu.title}
                                                    </li>
                                                )}
                                                {menu.items.map(item => (
                                                    <li className="pl-2" key={item.href}>
                                                        <SubNavItem href={item.href} as={item.href}>
                                                            {item.title}
                                                        </SubNavItem>
                                                    </li>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            {forceOpen && (
                <div className="fixed inset-0 transition-opacity lg:hidden z-20 backdrop-blur-sm">
                    <div
                        className="absolute inset-0 bg-gray-500 opacity-50"
                        onClick={() => onCloseMenu()}
                    />
                </div>
            )}
        </>
    );
}
