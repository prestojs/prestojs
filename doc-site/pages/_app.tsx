import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from '@prestojs/doc';
import '@prestojs/ui-antd/styles.less';
import type { AppProps } from 'next/app';
import { Suspense, useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/globals.css';
import './globalConfig';

function MyApp({ Component, pageProps, router, ...rest }: AppProps) {
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
                const { clientHeight } = entries[0].target;
                if (clientHeight === 0) {
                    return;
                }
                window.parent.postMessage(
                    JSON.stringify({
                        type: 'height-change',
                        height: clientHeight,
                    }),
                    '*'
                );
            });
            resizeObserver.observe(container);
        }
    }, [isExample]);
    if (isExample) {
        return (
            <Suspense fallback={null}>
                <div className="p-10 code-examples" id="code-example-root">
                    <Component {...pageProps} />
                </div>
                <div id="tooltip-container" />
            </Suspense>
        );
    }
    return (
        <MDXProvider components={mdxComponents}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
            <div id="tooltip-container" />
        </MDXProvider>
    );
}

export default MyApp;
