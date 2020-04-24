import React from 'react';
import Article from '../components/Article';
import MainMenuSidebar from '../components/MainMenuSidebar';

export default function Custom404() {
    return (
        <>
            <MainMenuSidebar />
            <Article>
                <h1>404 - Page Not Found</h1>
            </Article>
        </>
    );
}
