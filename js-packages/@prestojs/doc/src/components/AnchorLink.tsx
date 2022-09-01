import cx from 'classnames';
import React from 'react';

export function generateId(children: string | React.ReactNode) {
    if (typeof children === 'string') {
        return children
            .split(' ')
            .join('-')
            .replace(/[^a-zA-Z0-9-]/g, '');
    }
    console.warn('You must specify id if children is not a string');
    return '';
}

export default function AnchorLink({
    children,
    component: Component,
    id,
    className,
    style,
    ...rest
}: {
    children: React.ReactNode;
    component:
        | React.ComponentType<{ id: string; className: string }>
        | 'div'
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5';
    id: string;
    style?: Record<string, any>;
    className?: string;
}) {
    return (
        <Component
            id={id}
            {...rest}
            className={cx(
                className,
                'group flex whitespace-pre-wrap -ml-4 pl-4 mb-2 scroll-mt-20 items-center'
            )}
            style={style}
        >
            <a
                href={`#${id}`}
                className="absolute -ml-10 flex items-center opacity-0 border-0 group-hover:opacity-100 w-6 h-6 text-gray-400 ring-1 ring-gray-900/5 rounded-md shadow-sm flex items-center justify-center hover:ring-gray-900/10 hover:shadow hover:text-slate-700 z-50"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z"
                        clipRule="evenodd"
                    />
                </svg>
            </a>
            {children}
        </Component>
    );
}
