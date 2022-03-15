import React from 'react';

type Column<T> = {
    title: React.ReactNode;
    key: string;
    className?: string | ((record: T) => string | undefined);
    render?: (value: any, record: T) => React.ReactNode;
};

export default function Table<T>({
    columns,
    data,
    rowKey,
}: {
    columns: Column<T>[];
    data: T[];
    rowKey: string;
}): React.ReactElement {
    return (
        <table className="w-full text-left table-collapse mt-5 mb-5 z-10 relative">
            <thead>
                <tr>
                    {columns.map(column => (
                        <th
                            className="text-sm font-semibold text-gray-700 p-2 bg-gray-100"
                            key={column.key}
                        >
                            {column.title}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map(datum => (
                    <tr key={datum[rowKey]}>
                        {columns.map(column => {
                            const value = datum[column.key];
                            let className = column.className;
                            if (typeof className === 'function') {
                                className = className(datum);
                            }
                            return (
                                <td
                                    className={`p-2 border-t align-top ${className || ''}`}
                                    key={column.key}
                                >
                                    {column.render ? column.render(value, datum) : value}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
