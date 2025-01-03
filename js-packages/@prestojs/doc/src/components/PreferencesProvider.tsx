import React, { useContext, useMemo, useState } from 'react';

type PreferencesContext = {
    showInherited: boolean;
    setShowInherited: (value: boolean) => void;
};

const context = React.createContext<PreferencesContext | null>(null);

export function usePreferences(): PreferencesContext {
    const c = useContext(context);
    if (!c) {
        throw new Error('Must be used within <PreferencesProvider>');
    }
    return c;
}

export default function PreferencesProvider({
    children,
    initialShowInherited = true,
}: {
    children: React.ReactNode;
    initialShowInherited?: boolean;
}): React.ReactElement {
    const [showInherited, setShowInherited] = useState(initialShowInherited);
    const value = useMemo(
        () => ({
            showInherited,
            setShowInherited: (value: boolean) => {
                setShowInherited(value);
            },
        }),
        [showInherited, setShowInherited]
    );
    return <context.Provider value={value}>{children}</context.Provider>;
}
