/**
 * Write some content out to a json file as part of build
 *
 * Usage:
 *
 * new WriteJsonFilePlugin({
 *    // output file name relative to output dir
 *    name: 'my-stuff.json',
 *    // Contents that will be JSON.stringify'd
 *    contents: { stuff: 'to write out' },
 * }),
 */
class WriteJsonFile {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { contents, name } = this.options;
        compiler.hooks.emit.tapAsync('WriteJsonFilePlugin', (compilation, callback) => {
            const source = JSON.stringify(contents);
            compilation.assets[name] = {
                source() {
                    return source;
                },
                size() {
                    return source.length;
                },
            };
            callback();
        });
        return WriteJsonFile;
    }
}

module.exports = WriteJsonFile; // eslint-disable-line
