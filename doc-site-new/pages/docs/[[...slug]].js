import { ClassDoc, DocProvider, FunctionDoc } from '@prestojs/doc';
import fs from 'fs';
import path from 'path';

function TODO() {
    return <div>todo</div>;
}

const kindComponents = {
    Function: FunctionDoc,
    Class: ClassDoc,
    Variable: TODO,
    UnionInterface: TODO,
    Interface: ClassDoc,
};

export default function Doc({ references, meta, declaration }) {
    const DocComponent = kindComponents[declaration.kindString];
    console.log(declaration.kindString);
    if (!DocComponent) {
        throw new Error(`Don't know how to handle '${declaration.kindString}'`);
    }
    return (
        <DocProvider referencedTypes={references}>
            <DocComponent node={{ meta, declaration }} />
        </DocProvider>
    );
}

export async function getStaticProps(context) {
    const slug = context.params?.slug.join('/');
    const fn = path.join(process.cwd(), 'data', `${slug}.json`);
    const data = JSON.parse(fs.readFileSync(fn, 'utf-8'));
    console.log(fn);
    return {
        props: {
            ...data,
            slug,
        },
    };
}

function readDirRecursive(dir) {
    const files = [];
    for (const fn of fs.readdirSync(dir)) {
        const p = path.resolve(dir, fn);
        if (fs.statSync(p).isDirectory()) {
            files.push(...readDirRecursive(p));
        } else {
            files.push(p);
        }
    }
    return files;
}

export function getStaticPaths() {
    const docDataDir = path.join(process.cwd(), 'data') + '/';
    const paths = readDirRecursive(docDataDir)
        .filter(fn => !(fn.endsWith('all.json') || fn.endsWith('apiMenu.json')))
        .map(fn => ({
            params: { slug: fn.replace(docDataDir, '').replace('.json', '').split('/') },
        }));

    return {
        paths,
        fallback: false,
    };
}
