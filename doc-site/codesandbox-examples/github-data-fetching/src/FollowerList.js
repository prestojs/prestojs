import { PageNumberPaginator, useAsyncListing, usePaginator } from '@prestojs/util';
import React from 'react';
import * as githubApi from './github-api';
import UserList from './UserList';
import UserSearch from './UserSearch';

export default function FollowerList() {
    const [user, setUser] = React.useState();
    const paginator = usePaginator(PageNumberPaginator);
    const { result, isLoading, error, run, reset, ...rest } = useAsyncListing({
        trigger: user ? 'DEEP' : 'MANUAL',
        execute: githubApi.getFollowers,
        paginator,
        query: { user },
        accumulatePages: true,
    });
    return (
        <div>
            <UserSearch
                onSearch={setUser}
                disabled={isLoading}
                onReset={reset}
                buttonText="Get Followers"
            />
            <UserList users={result} />
            {result && (
                <div className="flex justify-between p-1 m-1">
                    <button
                        onClick={() => paginator.next()}
                        disabled={!paginator.hasNextPage}
                        className="btn-blue"
                    >
                        Fetch more
                    </button>
                </div>
            )}
            {error && (
                <p>
                    Failed with status: {error.status} {error.statusText}
                </p>
            )}
        </div>
    );
}
