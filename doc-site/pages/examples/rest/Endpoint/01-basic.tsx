/**
 * Simple usage with useAsync
 *
 * This example uses [prepare](doc:Endpoint#Method-prepare) to return a function
 * that `useAsync` can call. As `prepare` isn't passed any arguments it will always
 * return the same function. As such `useAsync` will only call it once even if the
 * component re-renders.
 */
import { Endpoint } from '@prestojs/rest';
import { useAsync } from '@prestojs/util';
import React from 'react';

const endpoint = new Endpoint<{ id: number; name: string }[]>('/api/users/');

export default function Basic() {
    const { result } = useAsync(endpoint.prepare(), { trigger: 'SHALLOW' });
    return (
        <div>
            {result?.result.map(user => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
