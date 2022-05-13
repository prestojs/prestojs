import fs from 'fs';
import path from 'path';

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
        .filter(
            fn =>
                fn.endsWith('.json') &&
                !(
                    fn.endsWith('apiMenu.json')
                    // fn.endsWith('viewModelFactory.json')
                )
        )
        .map(fn => ({
            params: { slug: fn.replace(docDataDir, '').replace('.json', '').split('/') },
        }));
    return {
        paths,
        fallback: false,
    };
}
