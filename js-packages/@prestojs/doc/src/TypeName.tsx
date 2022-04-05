import Modal from '@prestojs/doc/Modal';
import PrecompiledMarkdown from '@prestojs/doc/PrecompiledMarkdown';
import Tooltip from '@prestojs/doc/Tooltip';
import { useTypeArgumentsContext } from '@prestojs/doc/TypeArgumentsProvider';
import Link from 'next/link';
import React, { ReactNode, useContext } from 'react';
import { JSONOutput } from 'typedoc';
import DeclarationsTable, { resolveChildrenFromType } from './DeclarationsTable';
import { useDocContext } from './DocProvider';
import FunctionDescription from './FunctionDescription';
import KindDescription from './KindDescription';

type TypeNameContext = {
    mode: 'COMPACT' | 'EXPANDED';
};

const context = React.createContext<TypeNameContext>({ mode: 'COMPACT' });

export function useTypeNameContext(): TypeNameContext {
    return useContext(context);
}

export function TypeNameProvider({
    children,
    ...options
}: Partial<TypeNameContext> & { children: ReactNode }) {
    const defaults = useTypeNameContext();
    return <context.Provider value={{ ...defaults, ...options }}>{children}</context.Provider>;
}

type Props = {
    name?: string;
    type:
        | JSONOutput.SomeType
        | JSONOutput.MappedType
        | JSONOutput.TemplateLiteralType
        | JSONOutput.NamedTupleMemberType;
};

function ReferencedType({ type }: { type: JSONOutput.ReferenceType }): React.ReactElement {
    const docContext = useDocContext();
    const { typeArguments } = useTypeArgumentsContext();
    if (
        type.id &&
        docContext &&
        docContext.referencedTypes[type.id] &&
        type.package !== 'typescript'
    ) {
        const referencedType = docContext.referencedTypes[type.id];
        if (referencedType.type) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return <TypeName type={referencedType.type} name={referencedType.name} />;
        }
        if (
            referencedType.kindString === 'Interface' &&
            referencedType.signatures?.length &&
            referencedType.signatures[0].name === referencedType.name
        ) {
            return <FunctionDescription signatures={referencedType.signatures} />;
        }
        if (referencedType.slug) {
            return (
                <Link href={`/docs/${referencedType.slug}`}>
                    <a className="border-b border-orange-400 hover:border-b-2 text-orange-400">
                        {type.name}
                    </a>
                </Link>
            );
        }

        if (referencedType.kindString === 'Interface' && referencedType.children) {
            const content = (
                <DeclarationsTable
                    declarations={referencedType.children}
                    title={<strong>An object with these properties:</strong>}
                    showRequiredColumn
                    indexSignature={referencedType.indexSignature}
                />
            );
            return (
                <ExpandableDescription expandedContent={content} title={type.name} forceCompact />
            );
        }
    }
    if (type.name === 'ViewModelConstructor') {
        return (
            <Link href={`/docs/viewmodel/viewModelFactory#ViewModel-Class`}>
                <a className="border-b border-orange-400 hover:border-b-2 text-orange-400">
                    ViewModel Class
                </a>
            </Link>
        );
    }
    if (typeArguments[type.name]) {
        const { resolvedType, typeArgument } = typeArguments[type.name];
        if (resolvedType) {
            return <TypeName type={resolvedType} />;
        }
        return (
            <span className="text-gray-500" key={typeArgument.name}>
                {typeArgument.comment?.shortTextMdx || typeArgument.comment?.textMdx ? (
                    <Tooltip
                        className="underline decoration-dotted"
                        content={
                            <>
                                {typeArgument.comment?.shortTextMdx && (
                                    <PrecompiledMarkdown
                                        code={typeArgument.comment?.shortTextMdx}
                                    />
                                )}
                                {typeArgument.comment?.textMdx && (
                                    <PrecompiledMarkdown code={typeArgument.comment?.textMdx} />
                                )}
                                {typeArgument.default && (
                                    <>
                                        Defaults to <TypeName type={typeArgument.default} />
                                    </>
                                )}
                            </>
                        }
                    >
                        {typeArgument.name}
                    </Tooltip>
                ) : (
                    typeArgument.name
                )}
            </span>
        );
    }
    return <span className="text-blue-400">{type.name}</span>;
}

function ExpandableDescription({
    title,
    expandedContent,
    forceCompact,
}: {
    title?: ReactNode;
    expandedContent: ReactNode;
    forceCompact?: boolean;
}) {
    const [showModal, setShowModal] = React.useState(false);
    const { mode } = useTypeNameContext();
    if (mode === 'EXPANDED' && !forceCompact) {
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

function IntersectionType(props: { name?: string; type: JSONOutput.IntersectionType }) {
    const context = useDocContext();
    if (!context) {
        return <>TODO: intersection</>;
    }
    const children = resolveChildrenFromType(props.type, context.referencedTypes);
    if (children?.length > 0) {
        const content = (
            <DeclarationsTable
                declarations={children}
                title={<strong>An object with these properties:</strong>}
                showRequiredColumn
            />
        );
        return <ExpandableDescription expandedContent={content} title={props.name || 'Details'} />;
    }
    console.warn("Don't know good way to render intersection", children, props);
    return <>{props.name || '?'}</>;
    // const declaration = mergeDeclarations(
    //     ...(props.type.types
    //         .map(t => resolveType(t, context.referencedTypes)[1])
    //         .filter(Boolean) as DeclarationReflection[])
    // );
    //
    // console.log(
    //     'INTESRECT',
    //     declaration,
    //     props.type,
    //     props.type.types.map(t => resolveType(t, context.referencedTypes)[1])
    // );
    // if (!declaration.type) {
    //     return <>{declaration.name}</>;
    // }
    // // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // return <TypeName type={declaration.type} />;
}

function TupleType({ type }: { type: JSONOutput.TupleType }) {
    if (type.elements) {
        const length = type.elements.length;
        return (
            <span className="text-blue-400">
                [
                {type.elements.map((t, i) => (
                    <React.Fragment key={i}>
                        <TypeName type={t} />
                        {i < length - 1 && ', '}
                    </React.Fragment>
                ))}
                ]
            </span>
        );
    }
    return <span className="text-blue-400">Tuple</span>;
}

export default function TypeName({ type, name }: Props): React.ReactElement {
    const typeString = type.type;
    switch (typeString) {
        case 'array':
            return (
                <span className="text-blue-400">
                    {type.elementType.type === 'union' && '('}
                    <TypeName type={type.elementType} />
                    {type.elementType.type === 'union' && ')'}
                    []
                </span>
            );
        case 'intrinsic':
            return <span className="text-purple-400">{type.name}</span>;
        case 'literal':
            type.value;
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
        case 'union':
            return (
                <>
                    {type.types.map((t, i) => (
                        <React.Fragment key={i}>
                            <TypeName type={t} />
                            {i < type.types.length - 1 && <span className="text-gray-300">|</span>}
                        </React.Fragment>
                    ))}
                </>
            );
        case 'intersection':
            return <IntersectionType type={type} name={name} />;
        case 'typeOperator':
            return <>TODO: typeOperator</>;
        case 'reflection':
            if (type.declaration) {
                if (type.declaration.children) {
                    const content = (
                        <DeclarationsTable
                            declarations={type.declaration.children}
                            title={<strong>An object with these properties:</strong>}
                            showRequiredColumn
                        />
                    );
                    return (
                        <ExpandableDescription
                            expandedContent={content}
                            title={type.declaration.name}
                        />
                    );
                } else {
                    return <KindDescription declaration={type.declaration} />;
                }
            }
            return <>{type.type}</>;
        case 'reference':
            return <ReferencedType type={type} />;
        case 'query':
            return <ReferencedType type={type.queryType} />;
        case 'mapped':
            console.log('MAPPED', {
                type,
            });
            return <>TODO MAPPED</>;
        case 'tuple':
            return <TupleType type={type} />;
        case 'conditional':
        case 'indexedAccess':
        case 'named-tuple-member':
        case 'inferred':
        case 'optional':
        case 'predicate':
        case 'rest':
        case 'template-literal':
        case 'unknown':
            console.log(type);
            return <>TODO: {type.type}</>;
        default:
            // will be a type error if missing a case above
            const _exhaustiveCheck: never = typeString;
            return <>TODO: {typeString}</>;
    }
}
