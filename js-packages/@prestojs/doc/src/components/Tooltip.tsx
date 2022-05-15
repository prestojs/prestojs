import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({
    children,
    content,
    position,
    className,
}: {
    children: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    position?: 'left';
}) {
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const container: null | HTMLDivElement = useMemo(
        () =>
            typeof document != 'undefined' ? document.querySelector('#tooltip-container') : null,
        []
    );
    const [style, setStyle] = useState<{
        left: number;
        top: number;
        visibility: 'hidden' | 'visible';
    }>({ left: 0, top: 0, visibility: 'hidden' });
    const [arrowStyle, setArrowStyle] = useState<{
        left: number | string;
        top: number;
    }>({ left: 0, top: 0 });
    useEffect(() => {
        requestAnimationFrame(() => {
            if (ref.current && tooltipRef.current && isHovered) {
                const rect = ref.current.getBoundingClientRect();
                const { width, height } = tooltipRef.current?.getBoundingClientRect();
                if (position === 'left') {
                    setStyle({
                        left: rect.left - width - 10,
                        top: rect.top + rect.height / 2 - height / 2,
                        visibility: 'visible',
                    });
                } else {
                    const left = rect.left + rect.width / 2 - width / 2;
                    setStyle({
                        left: Math.max(0, left),
                        top: rect.bottom + 10,
                        visibility: 'visible',
                    });
                    setArrowStyle({
                        left: left < 0 ? rect.left + rect.width / 2 : 'calc(50% - 4px)',
                        top: -8,
                    });
                }
            } else {
                setStyle({
                    left: 0,
                    top: 0,
                    visibility: 'hidden',
                });
            }
        });
    }, [isHovered, position]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onMouseEnter = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsHovered(true);
    }, []);
    const onMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 100);
    }, []);
    return (
        <span
            className={`cursor-pointer${className ? ` ${className}` : ''}`}
            ref={ref}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
            {container &&
                isHovered &&
                createPortal(
                    <div
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        ref={tooltipRef}
                        className="fixed z-[100] rounded p-2 drop-shadow-lg bg-white text-sm tooltip max-w-screen-md border border-gray-900"
                        style={style}
                    >
                        <svg
                            className="absolute text-white fill-current stroke-current"
                            width="8"
                            height="8"
                            style={
                                position === 'left'
                                    ? { right: -8, top: 'calc(50% - 4px)' }
                                    : arrowStyle
                            }
                        >
                            {position === 'left' ? (
                                <>
                                    <polygon points="0,0 0,8 8,4" />
                                    <line
                                        strokeWidth="1"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="8"
                                        className="stroke-white"
                                    />
                                    <line x1="0" y1="0" x2="8" y2="4" className="stroke-gray-800" />
                                    <line x1="0" y1="8" x2="8" y2="4" className="stroke-gray-800" />
                                </>
                            ) : (
                                <>
                                    <polygon points="4,0 0,8 8,8" />

                                    <line
                                        strokeWidth="2"
                                        x1="0"
                                        y1="8"
                                        x2="8"
                                        y2="8"
                                        className="stroke-white"
                                    />
                                    <line x1="4" y1="0" x2="0" y2="8" className="stroke-gray-900" />
                                    <line x1="8" y1="8" x2="4" y2="0" className="stroke-gray-900" />
                                </>
                            )}
                        </svg>
                        {content}
                    </div>,
                    container
                )}
        </span>
    );
}
