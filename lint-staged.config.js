module.exports = {
    '*': ['./bin/lint/lint_secrets.sh'],
    '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write', 'git add'],
    '*.{less,json}': ['prettier --write', 'git add'],
    '*.sh': ['./bin/lint/lint_sh.sh'],
};
