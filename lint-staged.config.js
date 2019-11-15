module.exports = {
    '*': ['./bin/lint/lint_secrets.sh'],
    '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write', 'git add'],
    '*.{less,json}': ['prettier --write', 'git add'],
    '*.py': ['isort', 'black', 'git add', './bin/lint/lint_python_source.sh --color --skip-black'],
    '*.sh': ['./bin/lint/lint_sh.sh'],
};
