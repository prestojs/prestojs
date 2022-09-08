/**
 * Infinite scroll list
 *
 * As this list is scrolled to the bottom the next page is fetched. With the `accumulatePages` option instead
 * of results being replaced with the next page it will have the next page appended to it.
 */
import { Endpoint, paginationMiddleware, viewModelCachingMiddleware } from '@prestojs/rest';
import { useAsyncListing, usePaginator } from '@prestojs/util';
import {
    CharField,
    DateField,
    IntegerField,
    useViewModelCache,
    viewModelFactory,
} from '@prestojs/viewmodel';
import { Divider, List } from 'antd';
import 'antd/dist/antd.css';
import React, { useCallback } from 'react';

class User extends viewModelFactory(
    { id: new IntegerField(), name: new CharField(), registeredOn: new DateField() },
    { pkFieldName: 'id' }
) {
    static endpoints = {
        list: new Endpoint<User[]>('/api/paginated-users', {
            middleware: [viewModelCachingMiddleware(User), paginationMiddleware()],
        }),
    };
}

export default function InfiniteScrollList() {
    const paginator = usePaginator(User.endpoints.list);
    const execute = useCallback(async args => {
        return (await User.endpoints.list.execute(args)).result;
    }, []);
    const { result, isLoading } = useAsyncListing({
        execute,
        paginator,
        accumulatePages: true,
    });
    const users = useViewModelCache(User, cache => cache.getList(result || []));
    if (!result && isLoading) {
        return null;
    }
    return (
        <div
            className="overflow-auto"
            style={{ height: 423 }}
            onScroll={e => {
                const bottom =
                    e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
                    e.currentTarget.clientHeight;
                if (bottom && paginator.hasNextPage() && !isLoading) {
                    console.log('NEXT PAGE');
                    paginator.next();
                }
            }}
        >
            <List
                loading={isLoading}
                dataSource={users}
                renderItem={item => <List.Item key={item._key}>{item.name}</List.Item>}
            />
            {result && !paginator.hasNextPage() && <Divider plain>All results fetched</Divider>}
        </div>
    );
}
