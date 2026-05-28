import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['packages/**/*.js'],
    languageOptions: {
      ecmaVersion: 2018, // Node.js 10
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      // Optional catch binding isn't supported until ES2019
      'no-unused-vars': ['error', { caughtErrorsIgnorePattern: '^ignore' }],
    },
  },
]
