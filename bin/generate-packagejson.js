// Generate package.json to be published
// This should be run against each package after build
// This takes the main package.json, removes properties we don't care about and copies
// it into the build directory. The build directory is then what is published. This is
// so the build can output files into the root so can do imports like '@prestojs/ui/UiProvider'
// rather than '@prestojs/ui/build/module/UiProvider'.
const { argv } = require('yargs');
const fs = require('fs');
const path = require('path');
const [sourceDir, outputDir] = argv._;

const contents = JSON.parse(fs.readFileSync(path.resolve(sourceDir, 'package.json')));
delete contents.devDependencies;
delete contents.scripts;

for (const entry of ['main', 'typings', 'module']) {
    // Strip the 'build' prefix. We need this in development so local resolution works (eg. for doc-site)
    // but for published version needs to be removed.
    contents[entry] = contents[entry].split('/').slice(1).join('/');
    if (!fs.existsSync(path.resolve(outputDir, contents[entry]))) {
        throw new Error(`${entry} entry '${contents[entry]}' doesn't exist`);
    }
}
const buildInfo = path.resolve(outputDir, 'tsconfig.tsbuildinfo');
if (fs.existsSync(buildInfo)) {
    fs.unlinkSync(buildInfo);
}
fs.copyFileSync(path.resolve(sourceDir, 'README.md'), path.resolve(outputDir, 'README.md'));
fs.writeFileSync(path.resolve(outputDir, 'package.json'), JSON.stringify(contents, null, 2));
