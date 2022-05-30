// skipLibCheck in monorepos doesn't work. This workaround patches offending
// files with a // @ts-nocheck header to opt them out.
// https://github.com/microsoft/TypeScript/issues/38538#issuecomment-892555422
const fs = require('fs');
const path = require('path');
var semver = require('semver');

const ADDED_STR = '// @ts-nocheck\n\n';
const FILES = [
    ['@ant-design/react-slick/types.d.ts', '0.28.4'],
    ['rc-virtual-list/lib/List.d.ts', '3.4.8'],
];

async function addTsNoCheck([file, packageVersion]) {
    let packageName = file.split('/')[0];
    if (file.startsWith('@')) {
        packageName = file.split('/').slice(0, 2).join('/');
    }
    const packageJson = JSON.parse(
        fs
            .readFileSync(path.resolve(__dirname, '../node_modules', packageName, 'package.json'))
            .toString()
    );

    if (semver.gt(packageJson.version, packageVersion)) {
        throw new Error(
            `Patching ${file} with ts-nocheck but may have been fixed in more recent version (${packageVersion}); try removing the file from FILES, re-install node_modules and run check-types to see. If issue still exists update version number to match ${packageJson.version}`
        );
    }
    file = path.resolve(__dirname, '../node_modules', file);
    const content = fs.readFileSync(file).toString();

    if (content.includes(ADDED_STR)) {
        console.log(JSON.stringify(ADDED_STR), 'is already in', file);
    } else {
        fs.writeFileSync(file, ADDED_STR + content);
        console.log(JSON.stringify(ADDED_STR), 'added into', file);
    }
}

Promise.allSettled(FILES.map(addTsNoCheck)).then(results => {
    let hasErrors = false;

    for (const result of results) {
        if (result.status === 'rejected') {
            hasErrors = true;
            console.error(result.reason);
        }
    }

    if (hasErrors) {
        process.exit(1);
    }
});
