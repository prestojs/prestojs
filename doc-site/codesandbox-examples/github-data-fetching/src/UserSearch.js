import React from 'react';

export default function UserSearch({ onSearch, onReset, disabled, buttonText }) {
    const [user, setUser] = React.useState('octocat');

    return (
        <>
            <input value={user} onChange={e => setUser(e.target.value)} type="text" />
            <div className="my-2 justify-between flex">
                <button onClick={() => onSearch(user)} disabled={disabled} className="btn-blue">
                    {buttonText}
                </button>
                <button className="btn" onClick={onReset} disabled={disabled}>
                    Clear
                </button>
            </div>
        </>
    );
}
