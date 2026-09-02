import React from 'react';

const ALLIANCE_UI_URL = 'https://ui.alliance.software/';

/**
 * Packages that are considered legacy and the migration details to show for them.
 */
const legacyPackages: Record<string, { migrationUrl: string; migrationLabel: string }> = {
    ui: {
        migrationUrl: `${ALLIANCE_UI_URL}?path=/docs/formatting-values--docs`,
        migrationLabel: 'formatting values guide',
    },
    'ui-antd': {
        migrationUrl: ALLIANCE_UI_URL,
        migrationLabel: '@alliancesoftware/ui component library',
    },
    'final-form': {
        migrationUrl: `${ALLIANCE_UI_URL}?path=/docs/form-formfield--docs`,
        migrationLabel: 'Form & FormField documentation',
    },
};

export function isLegacyPackage(packageName: string): boolean {
    return packageName in legacyPackages;
}

/**
 * Renders a prominent banner indicating a package is legacy, with a link to the relevant
 * migration documentation. Renders nothing if `packageName` is not a legacy package.
 */
export default function LegacyPackageBanner({
    packageName,
}: {
    packageName: string;
}): React.ReactElement | null {
    const details = legacyPackages[packageName];
    if (!details) {
        return null;
    }
    return (
        <div className="py-4 pl-6 pr-3 my-5 border-l-4 bg-rose-50 border-rose-400 text-gray-800">
            <strong className="block font-bold mb-1">
                ⚠️ @prestojs/{packageName} is a legacy package
            </strong>
            <p>
                It is maintained for existing projects but should not be used for new projects. New
                projects should use{' '}
                <a
                    href={ALLIANCE_UI_URL}
                    className="text-cyan-700 underline hover:text-cyan-600"
                    target="_blank"
                    rel="noreferrer"
                >
                    @alliancesoftware/ui
                </a>{' '}
                instead — see the{' '}
                <a
                    href={details.migrationUrl}
                    className="text-cyan-700 underline hover:text-cyan-600"
                    target="_blank"
                    rel="noreferrer"
                >
                    {details.migrationLabel}
                </a>
                .
            </p>
        </div>
    );
}
