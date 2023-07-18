/**
 * Multi-select, parseValues
 *
 * This example shows how to use `AsyncChoices` to create a multi-select widget that handles parsing values to the
 * expected type. Matching on values is done using strict matching, so a type mismatch (e.g. `5 vs "5"`), will not
 * match. You can handle this by passing a `parseValues` function to `AsyncChoices` that will be called with each value
 * and should return the value in the expected type. Here we parse strings to numbers.
 *
 * @wide
 */
import { Form } from '@prestojs/final-form';
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
import {
    AntdUiProvider,
    FormItemWrapper,
    FormWrapper,
    getWidgetForField,
    SelectAsyncChoicesWidget,
} from '@prestojs/ui-antd';
import { PageNumberPaginator, usePaginator } from '@prestojs/util';
import {
    AsyncChoices,
    CharField,
    DateField,
    IntegerField,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Button } from 'antd';
import 'antd/dist/antd.min.css';
import React from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/paginated-users', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware()],
        }),
        detail: new Endpoint<User>('/api/user/:id', {
            middleware: [viewModelCachingMiddleware(User)],
        }),
    };
}

const asyncChoices = new AsyncChoices<User, number>({
    multiple: true,
    useListProps: () => {
        // Note that this is passed `query` and `listOptions`. You can pass through `listOptions` to
        // `SelectAsyncChoicesWidget` below (or `useAsyncChoices` if you're using it directly).
        const paginator = usePaginator(PageNumberPaginator);
        return {
            paginator,
            // any other values you return here will be available in `list` below
        };
    },
    /**
     * This is called when the dropdown is opened  and retrieves the items to display
     */
    async list({ query = {}, listOptions = {}, paginator }) {
        // `query` comes from `SelectAsyncChoicesWidget` and can contain `keywords` when filtering the list
        // `listOptions` can be passed through to `SelectAsyncChoicesWidget` or `useAsyncChoices`.
        // `paginator` comes from `useListProps`. You can also return other values from `useListProps` and they
        // will be available here.
        return (
            await User.endpoints.list.execute({
                query: {
                    ...query,
                    ...listOptions.query,
                },
                paginator,
            })
        ).result;
    },
    /**
     * This is called when a value needs to be resolved, for example if a value has been selected previously
     *
     * Note that you can also implement `useRetrieveProps` if you need to pass additional values that need to interact
     * with React (for example is you need to use `useState` or other hooks).
     */
    async retrieve(value, deps) {
        return (
            (
                await User.endpoints.list.execute({
                    query: {
                        ids: value,
                    },
                    ...deps,
                })
            ).result || []
        );
    },
    getLabel(item) {
        return item.name;
    },
    getValue(item) {
        return item.id;
    },
    parseValue(value: any): number {
        if (value == null || value === '') {
            return value;
        }
        return Number(value);
    },
});

export default function FormUsage() {
    return (
        <React.Suspense fallback="Loading...">
            <AntdUiProvider
                getWidgetForField={getWidgetForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <Form onSubmit={data => console.log(data)} initialValues={{ user: ['5', '7'] }}>
                    <Form.Item label="User">
                        <Form.Field
                            name="user"
                            render={fieldProps => (
                                <SelectAsyncChoicesWidget
                                    {...fieldProps}
                                    asyncChoices={asyncChoices}
                                    onRetrieveError={error => console.error(error)}
                                />
                            )}
                        />
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 6 }}>
                        <Button type="primary" htmlType="submit">
                            Submit (check console)
                        </Button>
                    </Form.Item>
                </Form>
            </AntdUiProvider>
        </React.Suspense>
    );
}
