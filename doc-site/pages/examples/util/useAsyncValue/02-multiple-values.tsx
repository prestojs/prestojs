/**
 * Multiple ViewModel Records
 *
 * Resolve [ViewModel](doc:viewModelFactory) records only if they aren't in the local cache already.
 *
 * Note that because ViewModel implements [Identifiable](doc:Identifiable) `getId` does not
 * need to be provided.
 */
import { Form } from '@prestojs/final-form';
import { Endpoint, viewModelCachingMiddleware } from '@prestojs/rest';
import {
    AntdUiProvider,
    CharWidget,
    FormItemWrapper,
    FormWrapper,
    getWidgetForField,
} from '@prestojs/ui-antd';
import useAsyncValue from '@prestojs/util/useAsyncValue';
import {
    CharField,
    DateField,
    IntegerField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
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

function UserList({ ids }: { ids: (string | number)[] }) {
    const existingValues = useViewModelCache(User, cache => cache.getAll('*'));
    const { value, error, isLoading } = useAsyncValue({
        existingValues,
        ids: ids.map(Number),
        resolve: useCallback(async ids => {
            return (await Promise.all(
                ids.map(async id => {
                    // If value is in cache return it
                    const value = existingValues.find(item => item.id === id);
                    if (value) {
                        return value;
                    }
                    try {
                        // Otherwise resolve it from the server or return `null` if not found
                        return (await User.endpoints.retrieve.execute({ urlArgs: { id } })).result;
                    } catch (e) {
                        // This would be any server error - assuming 404 here but could be more strict if desired
                        return null;
                    }
                })
            )) as User[];
        }, []),
    });
    if (error) {
        return <div>There was an unexpected error</div>;
    }
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (!value) {
        return <div>Not found</div>;
    }
    return (
        <div>
            {value.map(user =>
                user ? (
                    <div key={user._key}>{user.name}</div>
                ) : (
                    <div>
                        <em>Not Found</em>
                    </div>
                )
            )}
        </div>
    );
}

export default function UseAsyncValueSingleExample() {
    const initialIds = [1, 2, 3];
    const [ids, setId] = useState(initialIds);
    return (
        <AntdUiProvider
            getWidgetForField={getWidgetForField}
            formItemComponent={FormItemWrapper}
            formComponent={FormWrapper}
        >
            <Form
                onSubmit={data => setId(data.ids.split(',').map(Number))}
                initialValues={{ ids: initialIds.join(',') }}
                formProps={{ layout: 'vertical' }}
                validate={data => {
                    if (!data.ids) {
                        return { ids: 'Enter ids' };
                    }
                    const ids = data.ids.split(',').map(Number);
                    if (ids.find(Number.isNaN)) {
                        return { ids: 'Enter comma separated list of numbers' };
                    }
                    return {};
                }}
            >
                <Form.Item
                    label="Comma separated list of ids to lookup"
                    help="The local cache contains records 1 & 2"
                >
                    <Form.Field
                        name="ids"
                        render={fieldProps => (
                            <>
                                <CharWidget {...fieldProps} />
                                {fieldProps.meta.error && (
                                    <div className="text-red-500">{fieldProps.meta.error}</div>
                                )}
                            </>
                        )}
                    />
                </Form.Item>
            </Form>
            <hr className="my-10" />
            <UserList ids={ids} />
        </AntdUiProvider>
    );
}
