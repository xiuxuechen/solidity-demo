module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        // JavaScript 规则
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'quote-props': ['error', 'as-needed'],

        // 异步代码规则
        'no-await-in-loop': 'error',
        'require-await': 'error',

        // 代码风格
        'brace-style': ['error', '1tbs'],
        'comma-dangle': ['error', 'always-multiline'],
        'semi': ['error', 'always'],
    },
};