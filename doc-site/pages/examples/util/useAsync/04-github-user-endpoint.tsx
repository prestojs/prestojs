/**
 * useAsync with Endpoint
 *
 * Using `useAsync` with [Endpoint](doc:Endpoint) to retrieve a GitHub users profile and display their avatar image
 * and follower account.
 */
import { Endpoint } from '@prestojs/rest';
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

const githubUserEndpoint = new Endpoint<GithubUser>('/users/:username', {
    baseUrl: 'https://api.github.com',
});

export default function FollowerCount() {
    const [user, setUser] = React.useState('octocat');
    const method = githubUserEndpoint.prepare({ urlArgs: { username: user }, query: { a: 1 } });
    const { result, isLoading, error, run, reset } = useAsync(method, {
        args: [{ query: { a: 1 } }],
    });
    const { result: githubUser } = result || {};
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
            {githubUser && (
                <p>
                    <img src={githubUser.avatar_url} />
                    <br />
                    {githubUser.name} has {githubUser.followers} followers
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
