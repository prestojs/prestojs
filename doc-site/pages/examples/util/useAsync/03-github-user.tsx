/**
 * useAsync with fetch
 *
 * Using `useAsync` with [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to
 * retrieve a GitHub users profile and display their avatar image and follower account.
 */
import { ApiError } from '@prestojs/rest';
import { useAsync } from '@prestojs/util';
import { Button, Input } from 'antd';
import 'antd/es/button/style/index.css';
import 'antd/es/input/style/index.css';
import React from 'react';

type GithubUser = {
    avatar_url: string;
    name: string;
    followers: number;
};

// we don't define this inside FollowerCount() because that will create a new function on
// every render, causing useAsync() to re-run and triggering an infinite render loop
function getGithubUser(userName: string): Promise<GithubUser> {
    return fetch(`https://api.github.com/users/${userName}`).then(r => {
        if (r.ok) {
            return r.json();
        }
        throw new ApiError(r.status, r.statusText, r.body);
    });
}

export default function FollowerCount() {
    const [user, setUser] = React.useState('octocat');
    const { result, isLoading, error, run, reset } = useAsync<GithubUser, ApiError>(() =>
        getGithubUser(user)
    );
    return (
        <div>
            <Input value={user} onChange={e => setUser(e.target.value)} onPressEnter={run} />
            <div className="my-2 justify-between flex">
                <Button onClick={run} disabled={isLoading} type="primary">
                    Query follower count
                </Button>
                <Button type="text" onClick={reset}>
                    Clear
                </Button>
            </div>
            {result && (
                <p>
                    <img src={result.avatar_url} />
                    <br />
                    {result.name} has {result.followers} followers
                </p>
            )}
            {error && (
                <p>
                    Failed with status: {error.status} {error.statusText}
                </p>
            )}
        </div>
    );
}
