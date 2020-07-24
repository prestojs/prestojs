import React, { useState } from 'react';
import RightChevron from '../assets/icon-right-chevron.svg';

export default function Collapse({ children, title, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="collapse-box -mx-10 my-5 border-b border-t border-dashed bg-gray-100">
            <button
                onClick={() => setOpen(!open)}
                className="text-blue-700 items-center py-2 w-full text-left pl-5"
            >
                <RightChevron
                    className={`w-4 h-4 mr-5 inline transform ${open ? '-rotate-90' : 'rotate-90'}`}
                />
                {title}
            </button>{' '}
            {open && <div className="bg-gray-100 p-5">{children}</div>}
        </div>
    );
}
