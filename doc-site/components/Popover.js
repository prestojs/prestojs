import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export default function Popover({ children, title, content }) {
    const [isVisible, setIsVisible] = useState(false);
    const portalEl = useRef();
    if (!portalEl.current && typeof document !== 'undefined') {
        portalEl.current = document.createElement('div');
    }
    useEffect(() => {
        const listener = ({ key }) => {
            if (key === 'Escape') {
                setIsVisible(false);
            }
        };
        document.addEventListener('keydown', listener);
        document.body.appendChild(portalEl.current);
        return () => {
            document.removeEventListener('keydown', listener);
            document.body.removeChild(portalEl.current);
        };
    }, []);
    return (
        <div>
            <span onClick={() => setIsVisible(true)}>{children}</span>
            {isVisible &&
                ReactDOM.createPortal(
                    <div className="fixed bottom-0 inset-x-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50">
                        <div className="fixed inset-0 transition-opacity">
                            <div
                                className="absolute inset-0 bg-gray-500 opacity-50"
                                onClick={() => setIsVisible(false)}
                            />
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
                    </div>,
                    portalEl.current
                )}
        </div>
    );
}
