import React, { useEffect, useState } from 'react';

export default function Popover({ children, title, content }) {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const listener = ({ key }) => {
            if (key === 'Escape') {
                setIsVisible(false);
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, []);
    return (
        <div>
            <span onClick={() => setIsVisible(true)}>{children}</span>
            {isVisible && (
                <div className="fixed bottom-0 inset-x-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50">
                    <div className="fixed inset-0 transition-opacity">
                        <div
                            className="absolute inset-0 bg-gray-500 opacity-50"
                            onClick={() => setIsVisible(false)}
                        ></div>
                    </div>

                    <div
                        className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-4xl sm:w-full"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-headline"
                    >
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                {title && (
                                    <h3
                                        className="text-lg leading-6 font-medium text-gray-900"
                                        id="modal-headline"
                                    >
                                        {title}
                                    </h3>
                                )}
                                <div className="mt-2 font-light">{content}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
