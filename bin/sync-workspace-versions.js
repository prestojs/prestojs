/* eslint-disable @typescript-eslint/no-var-requires*/
const fs = require('fs');

const { version } = require('../package.json');

const rootPath = './js-packages/@prestojs';
const paths = fs.readdirSync(rootPath);

for (const path of paths) {
    const p = `${rootPath}/${path}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(p));
    packageJson.version = version;
    fs.writeFileSync(p, JSON.stringify(packageJson, null, 2));
}
