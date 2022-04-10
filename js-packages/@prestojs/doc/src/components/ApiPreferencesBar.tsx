import React from 'react';
import { usePreferences } from './PreferencesProvider';

export default function ApiPreferencesBar() {
    const { showInherited, setShowInherited } = usePreferences();
    return (
        <div className="my-2 my-4 flex justify-between border-b border-gray-400">
            <h2 className="font-semibold text-lg">API</h2>
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
