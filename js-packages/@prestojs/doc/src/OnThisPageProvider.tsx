import React, { ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type OnThisPageSection = {
    title: ReactNode;
    titleId?: string;
    links: { title: ReactNode; id: string }[];
    renderEmpty?: boolean;
};

type RemoveSectionCallback = () => void;
type OnThisPageContext = {
    sections: OnThisPageSection[];
    addSections: (sections: OnThisPageSection[]) => RemoveSectionCallback;
};

const context = React.createContext<OnThisPageContext | false>(false);

export function useOnThisPageSections(): OnThisPageContext {
    const c = useContext(context);
    if (!c) {
        throw new Error('must be used within OnThisPageProvider');
    }
    return c;
}

export default function OnThisPageProvider({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const [sections, setSection] = useState<OnThisPageSection[]>([]);
    const addSections = useCallback((newSections: OnThisPageSection[]) => {
        setSection(current => [...current, ...newSections]);
        return () => {
            setSection(current => current.filter(section => !newSections.includes(section)));
        };
    }, []);
    const value = useMemo(
        () => ({
            sections,
            addSections,
        }),
        [sections, addSections]
    );
    return <context.Provider value={value}>{children}</context.Provider>;
}
