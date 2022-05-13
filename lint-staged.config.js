module.exports = {
    '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write', 'git add'],
    '*.{less,json}': ['prettier --write', 'git add'],
};
