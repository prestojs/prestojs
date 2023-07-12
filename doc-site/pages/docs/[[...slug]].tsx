import { ClassPageDoc, FunctionPageDoc } from '@prestojs/doc';
import fs from 'fs';
import cloneDeep from 'lodash/cloneDeep';
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
    const toReplace: any[] = [];
    let data = JSON.parse(fs.readFileSync(fn, 'utf-8'), (key, value) => {
        if (value && typeof value === 'object') {
            if (value._id) {
                bySourceId[value._id] = value;
                delete value._id;
            }
            if (value._rid) {
                toReplace.push(value);
            }
        }
        return value;
    });
    toReplace.forEach(value => {
        if (!value._rid) {
            return;
        }
        const r = bySourceId[value._rid];
        if (!r) {
            throw new Error(`Unexpected: could not find circular ref ${value._rid}`);
        }
        Object.assign(value, cloneDeep(r));
        delete value._rid;
    });
    return {
        props: {
            ...data,
            bySourceId,
            toReplace,
            slug,
        },
    };
}
