const name = require('./package.json').name;
module.exports = {
    rules: {
        'no-restricted-imports': [
            'error',
            {
                // Within a package all imports to the same package should be relative, eg.
                // "import ViewModel from './ViewModel'" not
                // not "import { ViewModel } from '@prestojs/viewmodel';"
                patterns: [name],
            },
        ],
    },
};
