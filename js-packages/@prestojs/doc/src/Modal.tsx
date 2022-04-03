import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type Props = {
    children: React.ReactNode;
    title?: React.ReactNode;
    isVisible: boolean;
    onClose?: () => void;
};

export default function Modal({ children, title, isVisible, onClose }: Props) {
    const portalEl = useRef<HTMLDivElement | null>(null);
    if (!portalEl.current && typeof document !== 'undefined') {
        portalEl.current = document.createElement('div');
    }
    useEffect(() => {
        if (!portalEl.current) {
            return () => {
                // do nothing
            };
        }
        const listener = ({ key }) => {
            if (key === 'Escape' && onClose) {
                onClose();
            }
        };
        document.addEventListener('keydown', listener);
        document.body.appendChild(portalEl.current);
        return () => {
            document.removeEventListener('keydown', listener);
            if (portalEl.current) {
                document.body.removeChild(portalEl.current);
                portalEl.current = null;
            }
        };
    }, []);
    if (!isVisible || !portalEl.current) {
        return null;
    }
    return ReactDOM.createPortal(
        <div className="fixed bottom-0 inset-x-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50">
            <div className="fixed inset-0 transition-opacity">
                <div
                    className="absolute inset-0 bg-gray-500 opacity-50"
                    onClick={() => onClose?.()}
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
                        <button
                            onClick={() => onClose?.()}
                            className="text-gray-400 absolute right-2 top-2 hover:text-gray-500"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                        {title && (
                            <h3
                                className="text-lg leading-6 font-medium text-gray-900 mb-2"
                                id="modal-headline"
                            >
                                {title}
                            </h3>
                        )}
                        <div className="font-light overflow-y-auto max-h-[90vh]">{children}</div>
                    </div>
                </div>
            </div>
        </div>,
        portalEl.current
    );
}
