/**
 * Single ViewModel record
 *
 * Resolve [ViewModel](doc:viewModelFactory)  records only if they aren't in the local cache already.
 *
 * Note that because ViewModel implements [Identifiable](doc:Identifiable) `getId` does not
 * need to be provided.
 */
import { Endpoint, viewModelCachingMiddleware } from '@prestojs/rest';
import useAsyncValue from '@prestojs/util/useAsyncValue';
import {
    CharField,
    DateField,
    IntegerField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { InputNumber } from 'antd';
import 'antd/dist/antd.css';
import React, { useCallback, useState } from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        retrieve: new Endpoint<User>('/api/user/:id', {
            middleware: [viewModelCachingMiddleware(User)],
        }),
    };
}

User.cache.add([
    {
        name: 'Riley Strickland (from cache)',
        id: 1,
        registeredOn: '2023-05-11',
    },
    {
        name: 'Alexandra Diaz (from cache)',
        id: 2,
        registeredOn: '2023-06-07',
    },
]);

function UserDetail({ id }: { id: string | number }) {
    const { value, isLoading } = useAsyncValue({
        existingValues: useViewModelCache(User, cache => cache.getAll('*')),
        id: Number(id),
        resolve: useCallback(async id => {
            console.log('wtf');
            return (await User.endpoints.retrieve.execute({ urlArgs: { id } })).result;
        }, []),
    });
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (!value) {
        return <div>Not found</div>;
    }
    return <div>{value.name}</div>;
}

export default function UseAsyncValueSingleExample() {
    const [id, setId] = useState(1);
    return (
        <div>
            <p>
                Enter an id (1-200). If value is in cache it will be returned immediately otherwise
                it will be fetched from the server. The cache has been populated with ids 1 &amp; 2.
            </p>
            <label className="font-bold">
                Id:{' '}
                <InputNumber
                    defaultValue={1}
                    min={1}
                    max={200}
                    step={1}
                    precision={0}
                    // @ts-ignore
                    onPressEnter={({ target: { value } }) => setId(value)}
                    onBlur={({ currentTarget: { value } }) => setId(Number(value))}
                />
            </label>
            <UserDetail id={id} />
        </div>
    );
}
