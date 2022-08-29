/**
 * Passing query parameters with useAsync
 *
 * This example shows what happens when arguments are passed to `prepare`.
 * When the `query` argument changes `prepare` will return a new function
 * which `useAsync` will call.
 */
import { Endpoint } from '@prestojs/rest';
import { useAsync } from '@prestojs/util';
import { Input } from 'antd';
import 'antd/es/input/style/index.css';
import React from 'react';

const endpoint = new Endpoint<{ id: number; name: string }[]>('/api/users');

export default function QueryParamsExample() {
    const [filter, setFilter] = React.useState('');
    const { result, isLoading } = useAsync(endpoint.prepare({ query: { filter } }), {
        trigger: 'SHALLOW',
    });
    return (
        <div>
            <Input
                disabled={isLoading}
                type="search"
                placeholder="Search"
                // @ts-ignore
                onPressEnter={({ target: { value } }) => setFilter(value)}
                style={{ maxWidth: 300 }}
            />
            {result?.result.map(user => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
