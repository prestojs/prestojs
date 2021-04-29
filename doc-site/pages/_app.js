import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import '../prism.css';
import './global.css';

export default function MyApp({ Component, pageProps, router }) {
    const isExample = router.pathname.startsWith('/examples/');
    useEffect(() => {
        if (isExample && typeof document !== 'undefined') {
            document.body.classList.add('doc-antd');
        }
    }, [isExample]);
    if (isExample) {
        return (
            // .doc-antd matches selector in prefix-antd-styles.js postcss plugin
            // all antd styles are prefixed with this so it doesn't pollute styles throughout
            // rest of doc site
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
