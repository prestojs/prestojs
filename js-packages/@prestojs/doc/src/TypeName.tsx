import { AugmentedDeclarationReflection } from '@prestojs/doc';
import React from 'react';
import { JSONOutput } from 'typedoc';
import Table from './Table';

type Props = {
    type:
        | JSONOutput.SomeType
        | JSONOutput.MappedType
        | JSONOutput.TemplateLiteralType
        | JSONOutput.NamedTupleMemberType;
};

function ObjectProperties(props: {
    properties: AugmentedDeclarationReflection[];
}): React.ReactElement {
    return (
        <Table<AugmentedDeclarationReflection>
            columns={[
                {
                    title: 'Property',
                    key: 'name',
                    className(property: AugmentedDeclarationReflection): string {
                        let className =
                            'font-semibold border-gray-300 font-mono text-xs text-purple-700 whitespace-nowrap';
                        if (property.deprecated) {
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
                        return property.kindString;
                    },
                },
                {
                    title: 'Description',
                    key: 'description',
                    className: 'border-gray-300 font-mono text-xs text-blue-700 align-top',
                    render: (type, property): React.ReactNode => {
                        return (
                            <>
                                TODO
                                {property.deprecated && (
                                    <div className="text-red-400">
                                        Deprecated
                                        {typeof property.deprecated == 'string' &&
                                            `: ${property.deprecated}`}
                                    </div>
                                )}
                            </>
                        );
                    },
                },
            ]}
            data={props.properties}
            rowKey="id"
        />
    );
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
        case 'conditional':
        case 'indexedAccess':
        case 'mapped':
        case 'named-tuple-member':
        case 'inferred':
        case 'optional':
        case 'predicate':
        case 'query':
        case 'reference':
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
