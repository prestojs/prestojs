import { ClassPageDoc, FunctionPageDoc } from '@prestojs/doc';
import fs from 'fs';
import path from 'path';

export { getStaticPaths } from '../../util.mjs';

export default function Doc(props) {
    if (props.page.pageType === 'function') {
        return <FunctionPageDoc {...props} />;
    }
    if (props.page.pageType === 'class') {
        return <ClassPageDoc {...props} />;
    }
    return <div>test</div>;
}

export async function getStaticProps(context) {
    const slug = context.params?.slug.join('/');
    const fn = path.join(process.cwd(), 'data', `${slug}.json`);
    const bySourceId = {};
    let data = JSON.parse(fs.readFileSync(fn, 'utf-8'), (key, value) => {
        if (value && typeof value === 'object') {
            if (value._id) {
                bySourceId[value._id] = value;
                delete value._id;
            }
        }
        return value;
    });
    if (Object.keys(bySourceId).length > 0) {
        const reviver = (key, value) => {
            if (value && typeof value === 'object' && value._rid) {
                const r = bySourceId[value._rid];
                if (!r) {
                    throw new Error(`Unexpected: could not find circular ref ${value._rid}`);
                }
                return JSON.parse(JSON.stringify(r), reviver);
            }
            return value;
        };
        data = JSON.parse(JSON.stringify(data), reviver);
    }
    return {
        props: {
            ...data,
            slug,
        },
    };
}
