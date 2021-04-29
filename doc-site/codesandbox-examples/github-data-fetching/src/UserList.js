import React from 'react';

export default function UserList({ users, emptyText = <p>No records found</p> }) {
    if (!users) {
        return emptyText;
    }
    return (
        <ul>
            {users.map(record => (
                <li key={record.login} className="flex items-center p-1 m-1 bg-white">
                    <img src={record.avatar_url} className="w-10 h-10 rounded-full mr-2" />{' '}
                    {record.login}
                </li>
            ))}
        </ul>
    );
}
