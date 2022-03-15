import { compile, run } from '@mdx-js/mdx';
import { Fragment, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime.js';

console.log(compile);

export default function Page({ code }) {
    const [mdxModule, setMdxModule] = useState<any>();
    const Content = mdxModule ? mdxModule.default : Fragment;
    console.log(code);

    useEffect(() => {
        (async () => {
            setMdxModule(await run(code, runtime));
        })();
    }, [code]);

    return <Content />;
}

export async function getStaticProps() {
    const code = String(
        await compile('# hi', { outputFormat: 'function-body' /* …otherOptions */ })
    );
    // const code = '';
    return { props: { code } };
}
