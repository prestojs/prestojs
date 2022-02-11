import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps, router }: AppProps) {
    return <Component {...pageProps} />;
}

export default MyApp;
