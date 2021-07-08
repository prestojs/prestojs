import React from 'react';
import { useAnchorLinkPrefix } from './AnchorLinkPrefix';

export default function AnchorLink({ Component, children, id, className = '' }) {
    const prefix = useAnchorLinkPrefix();
    id = prefix + id;
    return (
        <div id={id} className={`anchor-link ${className}`}>
            <a
                className="text-gray-500 no-underline absolute anchor-link-a hover hidden"
                aria-label="Anchor"
                href={`#${id}`}
                data-anchorlink={id}
            >
                #
            </a>
            <Component>{children}</Component>
        </div>
    );
}
