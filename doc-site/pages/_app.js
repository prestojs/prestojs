import React from 'react';
import Layout from '../components/Layout';
import '../prism.css';
import './global.css';

export default function MyApp({ Component, pageProps, router }) {
    if (router.pathname.includes('codesandbox-')) {
        return (
            <div className="p-10">
                <Component {...pageProps} />
            </div>
        );
    }
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}
