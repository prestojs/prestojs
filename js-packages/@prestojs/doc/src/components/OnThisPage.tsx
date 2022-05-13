import debounce from 'lodash/debounce';
import React, { useEffect, useMemo, useRef } from 'react';
import { PageSection } from '../newTypes';
import styles from './OnThisPage.module.css';
import { usePreferences } from './PreferencesProvider';

export function OnThisPageSection({ section }: { section: PageSection }) {
    const { showInherited } = usePreferences();
    const filteredLinks = section.links.filter(link => !link.isInherited || showInherited);
    return (
        <>
            <li className={styles.section}>
                <a href={`#${section.anchorId}`}>{section.title}</a>
                {filteredLinks.length > 0 && (
                    <ul>
                        {filteredLinks.map(({ title, anchorId }, i) => (
                            <li className="block py-1 font-medium hover:text-gray-900" key={i}>
                                <a href={`#${anchorId}`}>
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
                    </ul>
                )}
            </li>
        </>
    );
}

export default function OnThisPage({ sections }: { sections: PageSection[] }) {
    const { showInherited } = usePreferences();
    const listRef = useRef<HTMLUListElement>(null);
    const filteredSections = sections
        .map(section => ({
            ...section,
            links: section.links.filter(link => !link.isInherited || showInherited),
        }))
        .filter(section => section.showEmpty || section.links.length > 0);
    const handleScroll = useMemo(
        () =>
            debounce(() => {
                if (!listRef.current) {
                    return;
                }
                let current: HTMLLIElement | null = null;
                for (const anchor of listRef.current.querySelectorAll('a')) {
                    const [, id] = anchor.href.split('#');
                    const target = id && document.querySelector<HTMLElement>(`#${id}`);
                    if (target && target.offsetTop <= window.scrollY + 85) {
                        current = anchor.closest('li');
                    }
                }
                listRef.current
                    .querySelector(`.${styles.activeMenu}`)
                    ?.classList.remove(styles.activeMenu);
                listRef.current
                    .querySelector(`.${styles.activeSection}`)
                    ?.classList.remove(styles.activeSection);
                if (current) {
                    if (current.classList.contains(styles.section)) {
                        current.classList.add(styles.activeSection);
                        return;
                    }
                    current.classList.add(styles.activeMenu);
                    current.closest(`.${styles.section}`)?.classList.add(styles.activeSection);
                }
            }, 10),
        []
    );
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);
    return (
        <div className="fixed z-20 top-16 bottom-0 right-[max(0px,calc(50%-45rem))] w-[19.5rem] py-10 px-8 overflow-y-auto hidden xl:block">
            <h5 className="text-gray-800 font-semibold mb-4 text-sm flex items-center">
                On this page{' '}
                <button
                    className="hover:border-b border-gray-900  ml-2"
                    onClick={() => window.scrollTo({ left: 0, top: 0, behavior: 'smooth' })}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </h5>
            <ul className="text-gray-700 text-sm leading-6" ref={listRef}>
                {filteredSections.map(section => (
                    <OnThisPageSection key={section.anchorId} section={section} />
                ))}
            </ul>
        </div>
    );
}
