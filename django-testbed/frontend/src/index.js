import { Endpoint } from '@prestojs/rest';
import React from 'react';
import { render } from 'react-dom';

import App from './App';

/**
 * Helper to get django CSRF token. Needs to be called on every request as
 * the token can change (ie. after you login it will change)
 * @return {String} token
 */
function getCsrfToken() {
    const cookieMatch = document.cookie.match(/csrftoken=(.*?)(?:$|;)/);
    if (cookieMatch && cookieMatch.length > 1) {
        return cookieMatch[1];
    }
    // eslint-disable-next-line no-console
    console.error('CSRF cookie not set. API calls may fail.');
    return 'COOKIE NOT FOUND';
}

Endpoint.defaultConfig.requestInit = {
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRFToken': getCsrfToken(),
    },
    credentials: 'include',
};

render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
