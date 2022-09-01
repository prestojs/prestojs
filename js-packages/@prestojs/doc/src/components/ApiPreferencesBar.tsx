import React from 'react';
import AnchorLink from '../components/AnchorLink';
import { ClassPage } from '../newTypes';
import { usePreferences } from './PreferencesProvider';

export default function ApiPreferencesBar({ classPage }: { classPage: ClassPage }) {
    const { showInherited, setShowInherited } = usePreferences();
    const filterInherited = node => !node.isInherited;
    const filterInheritedMethod = node => !node.signatures?.[0]?.isInherited;
    const noInherited =
        classPage.properties.filter(filterInherited).length === classPage.properties.length &&
        classPage.methods.filter(filterInheritedMethod).length === classPage.methods.length &&
        classPage.staticProperties.filter(filterInherited).length ===
            classPage.staticProperties.length &&
        classPage.staticMethods.filter(filterInheritedMethod).length ===
            classPage.staticMethods.length;
    return (
        <div className="my-2 my-4 flex justify-between border-b border-gray-400">
            <AnchorLink component="h2" id="api" className="font-semibold text-lg">
                API
            </AnchorLink>
            {!noInherited && (
                <label className="cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showInherited}
                        onChange={({ target: { checked } }) => setShowInherited(checked)}
                    />{' '}
                    Show inherited
                </label>
            )}
        </div>
    );
}
