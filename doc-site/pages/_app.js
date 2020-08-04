import React from 'react';
import Layout from '../components/Layout';
import '../prism.css';
import './global.css';

export default function MyApp({ Component, pageProps }) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}
