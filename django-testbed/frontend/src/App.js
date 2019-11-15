import React from 'react';

import User from './models/User';

export default function App() {
    return (
        <div>
            {User._meta.label} / {User._meta.labelPlural}
        </div>
    );
}
