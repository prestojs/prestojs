import orderBy from 'lodash/orderBy';
import React, { ReactNode } from 'react';
import { JSONOutput } from 'typedoc';
import DeclarationDescription from './DeclarationDescription';
import { useDocContext } from './DocProvider';
import KindDescription from './KindDescription';
import Table from './Table';
import TypeName, { TypeNameProvider } from './TypeName';
import { DeclarationReflection } from './types';

export function resolveChildrenFromType(
    type: Exclude<JSONOutput.DeclarationReflection['type'], undefined>,
    referencedTypes: Record<string, JSONOutput.DeclarationReflection>
) {
    if (type.type === 'reference' && type.name === 'Omit' && type.typeArguments) {
        const children = resolveChildrenFromType(type.typeArguments[0], referencedTypes);
        if (children) {
            const omitTypes = type.typeArguments[1] as
                | JSONOutput.LiteralType
                | JSONOutput.UnionType;
            const omitKeys =
                omitTypes.type === 'union'
                    ? omitTypes.types.map((t: JSONOutput.LiteralType) => t.value)
                    : [omitTypes.value];
            return orderBy(
                children.filter(child => !omitKeys.includes(child.name)),
                'name'
            );
        } else {
            console.warn('Missing referenced type', type.typeArguments[0]);
        }
    }
    if (type.type === 'reference' && type.name === 'Pick' && type.typeArguments) {
        const children = resolveChildrenFromType(type.typeArguments[0], referencedTypes);
        if (children) {
            const pickTypes = type.typeArguments[1] as
                | JSONOutput.LiteralType
                | JSONOutput.UnionType;
            const pickKeys =
                pickTypes.type === 'union'
                    ? pickTypes.types.map((t: JSONOutput.LiteralType) => t.value)
                    : [pickTypes.value];
            return orderBy(children.filter(child => pickKeys.includes(child.name)));
        } else {
            console.warn('Missing referenced type', type.typeArguments[0]);
        }
    }
    if (type.type === 'reference' && type.id && referencedTypes[type.id]) {
        return resolveChildren(referencedTypes[type.id], referencedTypes);
    }
    if (type.type === 'reflection' && type.declaration) {
        return resolveChildren(type.declaration, referencedTypes);
    }
    if (type.type === 'intersection') {
        return orderBy(
            type.types
                .map(t => resolveChildrenFromType(t, referencedTypes))
                .reduce(
                    (
                        acc: DeclarationReflection[],
                        children: DeclarationReflection[] | undefined
                    ) => {
                        if (!children) {
                            return acc;
                        }
                        const names = children.map(child => child.name);
                        acc = acc.filter(({ name }) => !names.includes(name));
                        acc.push(...children);
                        return acc;
                    },
                    []
                ),
            'name'
        );
    }
    if (type.type === 'reference' && type.name === 'Partial' && type.typeArguments) {
        const children = resolveChildrenFromType(type.typeArguments[0], referencedTypes);
        if (children) {
            return children.map(child => ({
                ...child,
                flags: { ...child.flags, isOptional: true },
            }));
        } else {
            console.warn('Missing referenced type', type.typeArguments[0]);
        }
    }
    console.log('BLAH WOW', { type });
}

function resolveChildren(
    declaration: JSONOutput.DeclarationReflection,
    referencedTypes: Record<string, JSONOutput.DeclarationReflection>
) {
    if (declaration.children) {
        return orderBy(declaration.children, 'name');
    }
    const { type } = declaration;
    if (!type) {
        return undefined;
    }
    return resolveChildrenFromType(type, referencedTypes);
}

function shouldExpand(
    param: DeclarationReflection,
    referencedTypes: Record<string, DeclarationReflection>
) {
    if (param.docFlags?.expandProperties) {
        return true;
    }
    if (
        param.type?.type === 'reference' &&
        param.type.id &&
        referencedTypes[param.type.id]?.docFlags.expandProperties
    ) {
        return true;
    }
    return false;
}

export default function DeclarationsTable({
    declarations,
    attributeHeader = 'Property',
    showRequiredColumn = false,
    title,
    indexSignature,
}: {
    declarations: JSONOutput.DeclarationReflection[];
    attributeHeader?: React.ReactNode;
    showRequiredColumn?: boolean;
    title?: ReactNode;
    indexSignature?: JSONOutput.SignatureReflection;
}): React.ReactElement {
    const context = useDocContext();
    const { referencedTypes = {} } = context || {};

    const parameters: any[] = [];
    for (const param of declarations) {
        const children = shouldExpand(param, referencedTypes)
            ? resolveChildren(param, referencedTypes)
            : null;
        if (children) {
            parameters.push({
                ...param,
                docFlags: {
                    ...param.docFlags,
                    expandProperties: true,
                },
            });
            parameters.push(
                ...children.map(child => ({
                    ...child,
                    name: `${param.name}.${child.name}`,
                }))
            );
        } else {
            parameters.push(param);
        }
    }
    if (indexSignature) {
        parameters.push(indexSignature);
    }
    return (
        <Table
            title={title}
            columns={[
                showRequiredColumn && {
                    title: '',
                    key: 'required',
                    render(_, param) {
                        if (
                            param !== indexSignature &&
                            !param.flags?.isOptional &&
                            !param.defaultValue
                        ) {
                            return (
                                <abbr
                                    className="text-red-500 underline decoration-dotted"
                                    title="Required"
                                >
                                    *
                                </abbr>
                            );
                        }
                        return null;
                    },
                },
                {
                    title: attributeHeader,
                    key: 'name',
                    className: 'font-semibold font-mono text-xs text-purple-700 whitespace-nowrap',
                    colSpan(record) {
                        return record.docFlags.expandProperties ? 2 : 1;
                    },
                    render(name, prop) {
                        if (prop === indexSignature) {
                            return '...';
                        }
                        if (prop.flags?.isRest) {
                            return `...${name}`;
                        }
                        if (prop.docFlags.expandProperties) {
                            return (
                                <div className="pt-0.5">
                                    {name}
                                    <br />
                                    <em className="font-normal font-sans text-gray-800">
                                        An object with the properties below
                                    </em>
                                </div>
                            );
                        }
                        return name;
                    },
                },
                {
                    title: 'Type',
                    key: 'type',
                    shouldExclude(property) {
                        return property.docFlags.expandProperties;
                    },
                    render: (type, property): React.ReactNode => {
                        return (
                            <TypeNameProvider mode="COMPACT">
                                {type ? (
                                    <TypeName type={type} />
                                ) : (
                                    <KindDescription declaration={property} />
                                )}
                            </TypeNameProvider>
                        );
                    },
                },
                {
                    title: 'Description',
                    key: 'description',
                    className: 'font-mono text-xs text-blue-700 align-top td-type-desc',
                    render: (type, property): React.ReactNode => {
                        return <DeclarationDescription declaration={property} />;
                    },
                },
            ]}
            data={parameters}
            rowKey="id"
        />
    );
}
