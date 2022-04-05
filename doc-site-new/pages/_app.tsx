import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps, router }: AppProps) {
    const isExample = router.pathname.startsWith('/examples/');
    useEffect(() => {
        if (isExample && typeof document !== 'undefined') {
            const container = document.querySelector('#code-example-root');
            if (!container) {
                return;
            }
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
            resizeObserver.observe(container);
        }
    }, [isExample]);
    if (isExample) {
        return (
            <div className="p-10 code-examples" id="code-example-root">
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

export default MyApp;
