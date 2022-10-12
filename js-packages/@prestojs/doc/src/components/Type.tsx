import Link from 'next/link';
import React, { ReactNode } from 'react';
import { DocType, IndexedAccessType, TupleType } from '../newTypes';
import ClassPageDoc from '../pages/ClassPageDoc';
import FunctionDocumentation from './FunctionDocumentation';
import Modal from './Modal';
import PreferencesProvider from './PreferencesProvider';

import TypeParameterDescription from './TypeParameterDescription';
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
    className,
}: {
    mode: 'FULL' | 'COMPACT';
    title?: ReactNode;
    expandedContent: ReactNode;
    forceCompact?: boolean;
    className?: string;
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
            <Modal isVisible={showModal} onClose={() => setShowModal(false)} className={className}>
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
                {signatures.map((sig, i) => (
                    <FunctionDocumentation key={i} signature={sig} />
                ))}
            </Modal>
        </span>
    );
}

export default function Type({ type, mode = 'FULL' }: Props) {
    if (type.typeName === 'container') {
        let el;
        if (type.children.length === 0 && type.indexSignature) {
            el = (
                <span>
                    <span className="text-gray-400">
                        {'{[fieldName: string]: '}
                        <span className="text-orange-400">
                            <Type type={type.indexSignature.type} mode="COMPACT" />
                        </span>
                        {' }'}
                    </span>
                </span>
            );
        } else if (type.signatures?.length) {
            el = (
                <div>
                    <strong>A function with the following signature:</strong>
                    <div className="border-l pl-5 my-5">
                        <FunctionDocumentation signature={type.signatures[0]} />
                    </div>
                    <TypeTable
                        dataSource={type.children}
                        title={<p>In addition the function has these properties attached to it:</p>}
                        indexSignature={type.indexSignature}
                    />
                </div>
            );
        } else {
            el = (
                <TypeTable
                    dataSource={type.children}
                    title={<strong>An object with these properties:</strong>}
                    indexSignature={type.indexSignature}
                />
            );
        }
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
            <span className="type-union">
                {type.types.map((t, i) => (
                    <React.Fragment key={i}>
                        <Type type={t} mode={mode} />
                        {i < type.types.length - 1 && (
                            <span className="text-gray-300 union-separator">|</span>
                        )}
                    </React.Fragment>
                ))}
            </span>
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
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return <Tuple type={type} mode={mode} />;
    }
    if (type.typeName === 'indexedAccess') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return <IndexedAccess type={type} />;
    }
    if (type.typeName === 'predicate') {
        return <span className="text-purple-400">boolean</span>;
    }
    if (type.typeName === 'interface') {
        return (
            <PreferencesProvider initialShowInherited={false}>
                <ExpandableDescription
                    className="w-full max-w-7xl min-h-[500px]"
                    title={<span className="text-green-400">{type.classPage.name}</span>}
                    mode="COMPACT"
                    expandedContent={<ClassPageDoc isNested page={type.classPage} />}
                />
            </PreferencesProvider>
        );
    }
    if (type.typeName === 'componentProps') {
        return (
            <span>
                Any props from <Type type={type.type} />
            </span>
        );
    }
    if (type.typeName === 'es6Map') {
        return (
            <ExpandableDescription
                mode="COMPACT"
                title="Map"
                expandedContent={
                    <div className="type-es6map">
                        <p className="mb-6">
                            A{' '}
                            <a
                                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center border-b border-gray-800 hover:font-semibold"
                            >
                                Map
                            </a>{' '}
                            with the following key & value types
                        </p>
                        <dl>
                            <dt>Key</dt>
                            <dd>
                                <Type type={type.keyType} mode="FULL" />
                            </dd>
                            <dt>Value</dt>
                            <dd>
                                <Type type={type.valueType} mode="FULL" />
                            </dd>
                        </dl>
                    </div>
                }
            />
        );
    }
    return <>{type.typeName}</>;
}

function Tuple({ type, mode = 'FULL' }: { type: TupleType; mode: 'FULL' | 'COMPACT' }) {
    if (type.elements?.length) {
        const length = type.elements.length;
        return (
            <span className="text-blue-400">
                [
                {type.elements.map((t, i) => (
                    <React.Fragment key={i}>
                        <Type type={t} mode={mode} />
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
