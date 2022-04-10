import { compile, run } from '@mdx-js/mdx';
import { Fragment, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime.js';

export default function Page({ code }) {
    const [mdxModule, setMdxModule] = useState<any>();
    const Content = mdxModule ? mdxModule.default : Fragment;

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
    // // const code = '';
    // const code =
    //     '/*@jsxRuntime automatic @jsxImportSource react*/\nimport {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";\nfunction MDXContent(props = {}) {\n  const {wrapper: MDXLayout} = props.components || ({});\n  return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {\n    children: _jsx(_createMdxContent, {})\n  })) : _createMdxContent();\n  function _createMdxContent() {\n    const _components = Object.assign({\n      p: "p",\n      code: "code",\n      em: "em"\n    }, props.components);\n    return _jsxs(_components.p, {\n      children: ["Set to the rejected value of the promise. Only one of ", _jsx(_components.code, {\n        children: "error"\n      }), " and ", _jsx(_components.code, {\n        children: "result"\n      }), " can be set. If\\n", _jsx(_components.code, {\n        children: "isLoading"\n      }), " is true consider this stale (ie. based on ", _jsx(_components.em, {\n        children: "previous"\n      }), " props). This can be useful\\nwhen you want the UI to show the previous value until the next value is ready."]\n    });\n  }\n}\nexport default MDXContent;\n';
    return { props: { code } };
}
