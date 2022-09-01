import React, { ReactNode } from 'react';
import { DocType, Flags, IndexSignatureType, RichDescription } from '../newTypes';
import Description from './Description';
import Table from './Table';
import Type from './Type';

type Item = {
    flags: Flags;
    name: string;
    type: DocType;
    description?: RichDescription;
};

export default function TypeTable({
    dataSource,
    attributeHeader = 'Property',
    showRequiredColumn = true,
    title,
    indexSignature,
}: {
    dataSource: Item[];
    attributeHeader?: React.ReactNode;
    showRequiredColumn?: boolean;
    title?: ReactNode;
    indexSignature?: IndexSignatureType;
}): React.ReactElement {
    const parameters: Item[] = [];
    for (const param of dataSource) {
        const children =
            param.flags.expandProperties && param.type.typeName === 'container'
                ? param.type.children
                : null;
        if (children) {
            const { hideProperties } = param.flags;
            const filteredChildren = hideProperties
                ? children.filter(child => !hideProperties.includes(child.name))
                : children;
            if (filteredChildren.length > 0) {
                parameters.push(param);
                parameters.push(
                    ...filteredChildren.map(child => ({
                        ...child,
                        name: `${param.name}.${child.name}`,
                    }))
                );
            }
        } else {
            parameters.push(param);
        }
    }
    if (indexSignature) {
        parameters.push({
            flags: {},
            name: '...',
            type: indexSignature.type,
            description: indexSignature.description,
        });
    }
    return (
        <Table
            title={title}
            columns={[
                showRequiredColumn && {
                    title: '',
                    key: 'required',
                    props: {
                        style: {
                            width: 20,
                        },
                    },
                    render(_, item) {
                        if (!item.flags.isOptional && item.type.typeName !== 'propertiesFrom') {
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
                        return record.flags.expandProperties ? 2 : 1;
                    },
                    render(name, prop) {
                        if (prop.type.typeName === 'propertiesFrom') {
                            return '...';
                        }
                        if (prop.flags.isRestArg) {
                            return `...${name}`;
                        }
                        if (prop.flags.expandProperties) {
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
                    className: 'type-table-type',
                    shouldExclude(property) {
                        return !!property.flags.expandProperties;
                    },
                    render: (type, property): React.ReactNode => {
                        if (property.type.typeName === 'propertiesFrom') {
                            return <span className="text-purple-400">any</span>;
                        }
                        return <Type type={property.type} mode="COMPACT" />;
                        // return (
                        //     <TypeNameProvider mode="COMPACT">
                        //         {type ? (
                        //             <TypeName type={type} />
                        //         ) : (
                        //             <KindDescription declaration={property} />
                        //         )}
                        //     </TypeNameProvider>
                        // );
                    },
                },
                {
                    title: 'Description',
                    key: 'description',
                    className: 'font-mono text-xs text-blue-700 align-top td-type-desc',
                    render: (type, property): React.ReactNode => {
                        if (property.type.typeName === 'propertiesFrom') {
                            return (
                                <div>
                                    Any properties from{' '}
                                    <Type
                                        type={
                                            property.type.type.typeName === 'componentProps'
                                                ? property.type.type.type
                                                : property.type.type
                                        }
                                    />
                                    {property.type.excludeProperties && (
                                        <>
                                            {' '}
                                            except for these:
                                            <ul className="m-5">
                                                {property.type.excludeProperties.map(name => (
                                                    <li className="list-disc m-1" key={name}>
                                                        {name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <Description
                                description={property.description}
                                flags={property.flags}
                                shortOnly={property.type.typeName === 'referenceLink'}
                            />
                        );
                    },
                },
            ]}
            data={parameters}
            rowKey="name"
        />
    );
}
