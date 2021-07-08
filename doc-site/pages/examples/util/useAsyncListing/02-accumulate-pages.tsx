/**
 * Accumulate Pages
 *
 * If `accumulatePages` is passed then each extra page of data returned is added to the previous. You can see this
 * in the example by pressing the `Fetch more` button and observing the list of followers increasing.
 *
 * The accumulated data resets when a non-sequential page is fetched (eg. if you went from page 3 to 1) or if
 * the query parameters changed. You can observe this in the example by clicking an image. It will change the filtered
 * user and so any accumulated pages will be reset.
 */
import { PageNumberPaginator, useAsyncListing, usePaginator } from '@prestojs/util';
import React from 'react';

async function getFollowers({ paginator, query }) {
    const { user, page = 1, pageSize = 9 } = paginator.getRequestInit({ query }).query;
    return await fetch(
        `https://api.github.com/users/${user}/followers?page=${page}&per_page=${pageSize}`
    ).then(async r => {
        if (r.ok) {
            const link = r.headers.get('link') || '';
            const lastMatch = link.match(/<([^>]*)>; rel="last"/g);
            let approxTotal;
            if (lastMatch) {
                approxTotal = pageSize * Number(lastMatch[0].match(/[?&]page=([0-9]+)/)?.[1]);
            }
            const records = await r.json();
            paginator.setResponse({ total: approxTotal || records.length, pageSize });
            return records;
        }
        throw new Error(`${r.status}: ${r.statusText}`);
    });
}

function UserList({ users, onSelect, emptyText = <p>No records found</p> }) {
    if (!users) {
        return emptyText;
    }
    return (
        <div className="grid gap-4 grid-cols-3">
            {users.map(record => (
                <div className="relative cursor-pointer" onClick={() => onSelect(record.login)}>
                    <img src={record.avatar_url} className="w-full" />
                    <div
                        className="absolute top-0 w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.50)' }}
                    >
                        {record.login}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function BasicExample() {
    const [inputValue, setInputValue] = React.useState('octocat');
    const [user, setUser] = React.useState('');
    const paginator = usePaginator(PageNumberPaginator);
    const { result, isLoading, error, reset } = useAsyncListing({
        trigger: user ? 'DEEP' : 'MANUAL',
        execute: getFollowers,
        paginator,
        query: { user },
        accumulatePages: true,
    });
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)} type="text" />
            <div className="my-2 justify-between flex">
                <button
                    onClick={() => setUser(inputValue)}
                    disabled={isLoading}
                    className="btn-blue"
                >
                    Get Followers
                </button>
                <button className="btn" onClick={reset} disabled={isLoading}>
                    Clear
                </button>
            </div>
            <UserList
                users={result}
                onSelect={user => {
                    setInputValue(user);
                    setUser(user);
                }}
                emptyText={<p>{user && !isLoading ? 'No Records Found' : ''}</p>}
            />
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
            {error && <p>Failed: {error.message}</p>}
        </div>
    );
}
