import React, { HTMLProps } from 'react';

export type Column<T> = {
    title: React.ReactNode;
    key: string;
    className?: string | ((record: T) => string | undefined);
    render?: (value: any, record: T) => React.ReactNode;
    shouldExclude?: (record: T) => boolean;
    colSpan?: (record: T) => number;
    props?: HTMLProps<HTMLTableCellElement>;
};

export default function Table<T>({
    columns,
    data,
    rowKey,
    title,
}: {
    columns: (Column<T> | null | undefined | false)[];
    data: T[];
    rowKey: string;
    title?: React.ReactNode;
}): React.ReactElement {
    const resolvedColumns: Column<T>[] = columns.filter(Boolean) as Column<T>[];
    return (
        <table className="w-full text-left table-collapse mb-5 z-10 relative">
            <thead>
                {title && (
                    <tr>
                        <th colSpan={resolvedColumns.length}>{title}</th>
                    </tr>
                )}
                <tr>
                    {resolvedColumns.map((column: Column<T>) => (
                        <th
                            className="text-sm font-semibold text-gray-700 p-2 bg-gray-100 align-top"
                            key={column.key}
                            {...column.props}
                        >
                            {column.title}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map(datum => {
                    if (!(rowKey in datum)) {
                        console.warn(`Missing rowKey '${rowKey}' for row`, datum);
                    }
                    return (
                        <tr key={datum[rowKey]}>
                            {resolvedColumns
                                .filter(column => !column.shouldExclude?.(datum))
                                .map(column => {
                                    const value = datum[column.key];
                                    let className = column.className;
                                    if (typeof className === 'function') {
                                        className = className(datum);
                                    }
                                    return (
                                        <td
                                            className={`p-2 border-t align-top ${className || ''}`}
                                            key={column.key}
                                            colSpan={column.colSpan?.(datum) || 1}
                                        >
                                            {column.render ? column.render(value, datum) : value}
                                        </td>
                                    );
                                })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
