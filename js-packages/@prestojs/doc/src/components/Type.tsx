import FunctionDocumentation from '@prestojs/doc/components/FunctionDocumentation';

import TypeParameterDescription from '@prestojs/doc/components/TypeParameterDescription';
import Modal from '@prestojs/doc/Modal';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import { DocType, IndexedAccessType, TupleType } from '../newTypes';
import TypeTable from './TypeTable';

type Props = {
    type: DocType;
    mode?: 'FULL' | 'COMPACT';
};

function ExpandableDescription({
    mode,
    title,
    expandedContent,
    forceCompact,
}: {
    mode: 'FULL' | 'COMPACT';
    title?: ReactNode;
    expandedContent: ReactNode;
    forceCompact?: boolean;
}) {
    const [showModal, setShowModal] = React.useState(false);
    if (mode === 'FULL' && !forceCompact) {
        return <>{expandedContent}</>;
    }
    return (
        <>
            <button
                className="underline text-orange-400 hover:text-orange-600"
                onClick={() => setShowModal(true)}
            >
                {title}
            </button>
            <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
                {expandedContent}
            </Modal>
        </>
    );
}

function FunctionDescription({ signatures }: { signatures }) {
    const [showModal, setShowModal] = React.useState(false);
    if (!signatures?.length) {
        return <span className="text-orange-400">Function</span>;
    }
    return (
        <span className="text-orange-400">
            <button
                className="underline text-orange-400 hover:text-orange-600"
                onClick={() => setShowModal(true)}
            >
                Function
            </button>
            <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
                <FunctionDocumentation signature={signatures[0]} />
            </Modal>
        </span>
    );
}

export default function Type({ type, mode = 'FULL' }: Props) {
    if (type.typeName === 'container') {
        const el = (
            <TypeTable
                dataSource={type.children}
                title={<strong>An object with these properties:</strong>}
            />
        );
        return <ExpandableDescription expandedContent={el} mode={mode} title={type.name} />;
    }
    if (type.typeName === 'intrinsic') {
        return <span className="text-purple-400">{type.name}</span>;
    }
    if (type.typeName === 'literal') {
        if (typeof type.value == 'string') {
            return <span className="text-green-400">"{type.value}"</span>;
        }
        if (typeof type.value == 'boolean') {
            return <span className="text-red-400">{type.value.toString()}</span>;
        }
        if (typeof type.value == 'number' || typeof type.value == 'bigint') {
            return <span className="text-blue-400">{type.value.toString()}</span>;
        }
        if (type.value === null) {
            return <span className="text-gray-400">null</span>;
        }
        return <>{type.value}</>;
    }
    if (type.typeName === 'union') {
        return (
            <>
                {type.types.map((t, i) => (
                    <React.Fragment key={i}>
                        <Type type={t} mode={mode} />
                        {i < type.types.length - 1 && <span className="text-gray-300">|</span>}
                    </React.Fragment>
                ))}
            </>
        );
    }
    if (type.typeName === 'propertiesFrom') {
        return <span className="text-orange-400">Object</span>;
    }
    if (type.typeName === 'typeArgument') {
        return <TypeParameterDescription typeParameter={type} />;
    }
    if (type.typeName === 'methodType') {
        return <FunctionDescription signatures={type.signatures} />;
    }
    if (type.typeName === 'array') {
        return (
            <span className="text-blue-400">
                {type.elementType.typeName === 'union' && '('}
                <Type type={type.elementType} mode={mode} />
                {type.elementType.typeName === 'union' && ')'}
                []
            </span>
        );
    }
    if (type.typeName === 'unknown') {
        return <span className="text-blue-400">{type.name}</span>;
    }
    if (type.typeName === 'externalReference') {
        return (
            <a
                href={type.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border-b border-gray-800 hover:font-semibold"
            >
                {type.name}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-[0.9em] w-[0.9em] ml-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                </svg>
            </a>
        );
    }
    if (type.typeName === 'referenceLink') {
        return (
            <Link href={type.url}>
                <a className="cursor-pointer /inline-flex items-center border-b border-current hover:border-b-2">
                    {type.name}
                </a>
            </Link>
        );
    }
    if (type.typeName === 'tuple') {
        return <Tuple type={type} />;
    }
    if (type.typeName === 'indexedAccess') {
        return <IndexedAccess type={type} />;
    }
    if (type.typeName === 'predicate') {
        return <span className="text-purple-400">boolean</span>;
    }
    // @ts-ignore
    return <>{type.typeName}</>;
}

function Tuple({ type }: { type: TupleType }) {
    if (type.elements?.length) {
        const length = type.elements.length;
        return (
            <span className="text-blue-400">
                [
                {type.elements.map((t, i) => (
                    <React.Fragment key={i}>
                        <Type type={t} />
                        {i < length - 1 && ', '}
                    </React.Fragment>
                ))}
                ]
            </span>
        );
    }
    return <span className="text-blue-400">Tuple</span>;
}

function IndexedAccess({ type }: { type: IndexedAccessType }) {
    // TODO: Is there a good way to handle this?
    return <span className="text-gray-600">Object</span>;
}
