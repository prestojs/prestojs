/**
 * Trigger
 *
 * This example shows how you can switch the `trigger` prop to automatically fetch data based on some condition.
 *
 * There's two `useAsync` hooks here. The first will search for users and is triggered whenever you press the `Search`
 * button. The second will fetch the details for a user _once_ a user has been selected or whenever it changes
 * (`trigger={useAsync.SHALLOW}`). If no user has been selected it will do nothing (`trigger={useAsync.MANUAL}`). This
 * example also shows how to pass arguments through using the `options.args` option.
 *
 * This pattern is useful when you need to make the function call conditional on some piece of data (eg. a prop or
 * local state).
 */
import { useAsync } from '@prestojs/util';
import React, { useRef, useState } from 'react';

function getGithubUser(user) {
    return fetch(`https://api.github.com/users/${user}`).then(r => {
        if (r.ok) {
            return r.json();
        }
        throw new Error(`${r.status}: ${r.statusText}`);
    });
}

function searchUsers(keywords) {
    return fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(keywords)}&per_page=9`
    ).then(r => {
        if (r.ok) {
            return r.json();
        }
        throw new Error(`${r.status}: ${r.statusText}`);
    });
}

export default function TriggerExample() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [userLogin, setUserLogin] = useState<string | null>(null);
    const { result: searchResult, error, isLoading, reset: resetSearch, run } = useAsync(
        searchUsers
    );
    const { result: user, isLoading: isLoadingUser, reset: resetUser } = useAsync(getGithubUser, {
        args: [userLogin],
        trigger: userLogin ? useAsync.SHALLOW : useAsync.MANUAL,
    });
    const clear = () => {
        setUserLogin(null);
        resetSearch();
        resetUser();
    };
    return (
        <form
            className="grid grid-cols-1 gap-4 w-full"
            onSubmit={e => {
                e.preventDefault();
                run(inputRef.current?.value as string);
            }}
        >
            <input ref={inputRef} type="text" placeholder="Search for a github user" />
            <div className="flex justify-between">
                <button type="submit" className="btn-blue" disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Search'}
                </button>
                <button
                    type="reset"
                    className="btn-blue"
                    disabled={isLoading}
                    onClick={() => {
                        clear();
                    }}
                >
                    Clear
                </button>
            </div>
            {error && <div className="bg-red-100 text-red-800 p-5 rounded">{error.message}</div>}
            {searchResult ? (
                <>
                    <p>
                        Found {searchResult.total_count} results. Click image to get number of
                        followers.
                    </p>
                    {searchResult.total_count > 0 && (
                        <div className="grid gap-4 grid-cols-3">
                            {searchResult.items.map(record => (
                                <div
                                    key={record.id}
                                    className="relative cursor-pointer"
                                    onClick={() => setUserLogin(record.login)}
                                >
                                    <img src={record.avatar_url} className="w-full" />
                                    <div
                                        className="absolute top-0 w-full h-full hover:opacity-80 flex items-center justify-center text-white text-lg"
                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.50)' }}
                                    >
                                        {record.login}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <em>Enter a search string above</em>
            )}
            <p>
                <strong>Suggested Users:</strong>{' '}
                <button className="btn-text" onClick={() => setUserLogin('getify')}>
                    getify
                </button>{' '}
                <button className="btn-text" onClick={() => setUserLogin('octocat')}>
                    octocat
                </button>{' '}
                <button className="btn-text" onClick={() => setUserLogin('antirez')}>
                    antirez
                </button>
            </p>
            {isLoadingUser && <p>Retrieving user '{userLogin}'...</p>}
            {!isLoadingUser && user && (
                <p>
                    <img src={user.avatar_url} />
                    <br />
                    {user.name || user.login} has {user.followers} followers
                </p>
            )}
        </form>
    );
}
