import React from 'react';
import Layout from '../components/Layout';
import './global.css';
import '../prism.css';

export default function MyApp({ Component, pageProps }) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}
