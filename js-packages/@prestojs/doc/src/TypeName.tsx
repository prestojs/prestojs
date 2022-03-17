import React from 'react';
import { JSONOutput } from 'typedoc';
import { useDocContext } from './DocProvider';
import PrecompiledMarkdown from './PrecompiledMarkdown';
import Table from './Table';
import { DeclarationReflection } from './types';

type Props = {
    type:
        | JSONOutput.SomeType
        | JSONOutput.MappedType
        | JSONOutput.TemplateLiteralType
        | JSONOutput.NamedTupleMemberType;
};

function Kind({ declaration }: { declaration: DeclarationReflection }) {
    if (declaration.kindString === 'Method') {
        console.log(declaration);
        return <span className="text-orange-400">Method</span>;
    }
    return <>{declaration.name}</>;
}

function ObjectProperties(props: { properties: DeclarationReflection[] }): React.ReactElement {
    return (
        <Table<DeclarationReflection>
            columns={[
                {
                    title: 'Property',
                    key: 'name',
                    className(property: DeclarationReflection): string {
                        let className =
                            'font-semibold border-gray-300 font-mono text-xs text-purple-700 whitespace-nowrap';
                        if (property.docFlags.deprecated) {
                            className += ' line-through';
                        }
                        return className;
                    },
                },
                {
                    title: 'Type',
                    key: 'type',
                    render: (type, property): React.ReactNode => {
                        if (type) {
                            // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            return <TypeName type={type} />;
                        }
                        return <Kind declaration={property} />;
                    },
                },
                {
                    title: 'Description',
                    key: 'description',
                    className:
                        'border-gray-300 font-mono text-xs text-blue-700 align-top td-type-desc',
                    render: (type, property): React.ReactNode => {
                        return (
                            <>
                                {property.comment?.shortTextMdx && (
                                    <PrecompiledMarkdown code={property.comment?.shortTextMdx} />
                                )}
                                {property.comment?.textMdx && (
                                    <PrecompiledMarkdown code={property.comment?.textMdx} />
                                )}
                                {property.docFlags.deprecated && (
                                    <div className="text-red-400">
                                        Deprecated
                                        {typeof property.docFlags.deprecated == 'string' && (
                                            <>
                                                :{' '}
                                                <PrecompiledMarkdown
                                                    code={property.docFlags.deprecated}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    },
                },
            ]}
            data={props.properties}
            rowKey="id"
            title={<strong>An object with these properties:</strong>}
        />
    );
}

function ReferencedType({ type }: { type: JSONOutput.ReferenceType }): React.ReactElement {
    const docContext = useDocContext();
    if (type.id && docContext && docContext.referencedTypes[type.id]) {
        const referencedType = docContext.referencedTypes[type.id];
        console.log('TODO', { referencedType });
    }
    return <span className="text-blue-400">{type.name}</span>;
}

export default function TypeName({ type }: Props): React.ReactElement {
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
            return <>TODO: intersection</>;
        case 'typeOperator':
            return <>TODO: typeOperator</>;
        case 'reflection':
            if (type.declaration) {
                if (type.declaration.children) {
                    return <ObjectProperties properties={type.declaration.children} />;
                } else {
                    return <>TODO: reflection {type.declaration.kindString}</>;
                }
            }
            return <>{type.type}</>;
        case 'reference':
            return <ReferencedType type={type} />;
        case 'conditional':
        case 'indexedAccess':
        case 'mapped':
        case 'named-tuple-member':
        case 'inferred':
        case 'optional':
        case 'predicate':
        case 'query':
        case 'rest':
        case 'template-literal':
        case 'tuple':
        case 'unknown':
            return <>TODO: {type.type}</>;
        default:
            // will be a type error if missing a case above
            const _exhaustiveCheck: never = typeString;
            return <>TODO: {typeString}</>;
    }
}
