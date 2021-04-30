import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import '../prism.css';
import './global.css';

export default function MyApp({ Component, pageProps, router }) {
    const isExample = router.pathname.startsWith('/examples/');
    useEffect(() => {
        if (isExample && typeof document !== 'undefined') {
            const resizeObserver = new ResizeObserver(entries => {
                // Notify parent when height changes. CodeExamples.js uses this to adjust
                // size of frame.
                window.parent.postMessage(
                    JSON.stringify({
                        type: 'height-change',
                        height: entries[0].target.clientHeight,
                    }),
                    '*'
                );
            });
            resizeObserver.observe(document.body);
            // .doc-antd matches selector in prefix-antd-styles.js postcss plugin
            // all antd styles are prefixed with this so it doesn't pollute styles throughout
            // rest of doc site
            document.body.classList.add('doc-antd');
        }
    }, [isExample]);
    if (isExample) {
        return (
            <div className="p-10 code-examples">
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
