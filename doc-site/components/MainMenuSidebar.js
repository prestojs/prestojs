import { useRouter } from 'next/router';
import React from 'react';
import menuByName from '../data/apiMenu.json';
import Sidebar from './Sidebar';

const DEFAULTS_PROCESSED = Symbol.for('DEFAULTS_PROCESSED');
// Only do this once... only necessary for dev hotloading
if (!menuByName[DEFAULTS_PROCESSED]) {
    menuByName[DEFAULTS_PROCESSED] = true;
    // Any customisations to generated menu are done here
    menuByName.viewmodel.default.push({
        slug: 'viewmodel/viewModelFactory',
        title: 'viewModelFactory',
    });
}

function mapMenu(menu) {
    return {
        title: menu.title,
        href: '/docs/[...slug]',
        as: `/docs/${menu.slug}`,
    };
}

function compareMenu(a, b) {
    if (a.title < b.title) {
        return -1;
    }
    if (a.title > b.title) {
        return 1;
    }
    return 0;
}

export default function MainMenuSidebar({ children }) {
    const router = useRouter();
    const currentPackageName = router.asPath.split('/').filter(Boolean).slice(1).shift();
    let currentMenu;
    if (menuByName[currentPackageName]) {
        const defaultSection = (menuByName[currentPackageName].default || []).map(mapMenu);
        defaultSection.sort(compareMenu);
        currentMenu = [];
        for (const [groupName, items] of Object.entries(menuByName[currentPackageName])) {
            if (groupName === 'default') continue;
            const subMenu = items.map(mapMenu);
            items.sort(compareMenu);
            currentMenu.push({
                title: groupName,
                items: subMenu,
            });
        }
        currentMenu.sort(compareMenu);
        currentMenu.unshift({
            isDefault: true,
            items: defaultSection,
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
                { href: '/docs/util', title: 'Util' },
            ]}
        >
            {currentMenu && <Sidebar.LinksSection title={currentPackageName} links={currentMenu} />}
            {children}
        </Sidebar>
    );
}
