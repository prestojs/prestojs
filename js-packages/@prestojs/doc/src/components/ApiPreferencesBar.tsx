import React from 'react';
import AnchorLink from '../components/AnchorLink';
import { usePreferences } from './PreferencesProvider';

export default function ApiPreferencesBar() {
    const { showInherited, setShowInherited } = usePreferences();
    return (
        <div className="my-2 my-4 flex justify-between border-b border-gray-400">
            <AnchorLink component="h2" id="api" className="font-semibold text-lg">
                API
            </AnchorLink>
            <label className="cursor-pointer">
                <input
                    type="checkbox"
                    checked={showInherited}
                    onChange={({ target: { checked } }) => setShowInherited(checked)}
                />{' '}
                Show inherited
            </label>
        </div>
    );
}
