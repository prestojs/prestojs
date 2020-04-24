import { useRouter } from 'next/router';
import React from 'react';
import menuByName from '../data/apiMenu.json';
import Sidebar from './Sidebar';

const extraMenuItems = {
    viewmodel: [
        {
            slug: 'viewmodel/viewModelFactory',
            title: 'viewModelFactory',
        },
    ],
};

export default function MainMenuSidebar({ children }) {
    const router = useRouter();
    const currentPackageName = router.asPath
        .split('/')
        .filter(Boolean)
        .slice(1)
        .shift();
    let currentMenu = menuByName[currentPackageName];
    if (currentMenu) {
        currentMenu = [
            ...currentMenu.map(menu => ({
                title: menu.title,
                href: '/docs/[...slug]/',
                as: `/docs/${menu.slug}/`,
            })),
            ...(extraMenuItems[currentPackageName] || []).map(menu => ({
                title: menu.title,
                href: `/docs/${menu.slug}/`,
            })),
        ];
        currentMenu.sort((a, b) => {
            if (a.title < b.title) {
                return -1;
            }
            if (a.title > b.title) {
                return 1;
            }
            return 0;
        });
    }

    return (
        <Sidebar
            links={[
                { href: '/docs/tutorial', title: 'Tutorial' },
                { href: '/docs/viewmodel', title: 'View Model' },
                { href: '/docs/final-form', title: 'Final Form' },
                { href: '/docs/rest', title: 'REST' },
                { href: '/docs/routing', title: 'Routing' },
                { href: '/docs/ui', title: 'UI' },
                { href: '/docs/ui-antd', title: 'UI ANTD' },
            ]}
        >
            {currentMenu && <Sidebar.LinksSection title={currentPackageName} links={currentMenu} />}
            {children}
        </Sidebar>
    );
}
