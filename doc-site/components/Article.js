import React from 'react';

export default function Article({ children }) {
    return (
        <div className="min-h-screen w-full lg:static lg:max-h-full lg:overflow-visible lg:w-3/4 xl:w-4/5 pr-10">
            <div className="flex">
                <div className="pt-24 pb-16 lg:pt-28 w-full" id="main-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
