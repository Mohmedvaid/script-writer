module.exports = {
  env: {
    node: true, // Node.js environment
    es2021: true, // ES6 and later
    jest: true // If you use Jest for testing
  },
  extends: [
    'eslint:recommended', // Basic ESLint rules
    'plugin:prettier/recommended' // Integrates Prettier and ESLint
  ],
  parserOptions: {
    ecmaVersion: 12, // ES2021 support
    sourceType: 'module' // ES6 modules
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warns on unused vars
    'no-console': 'warn', // Warns on console statements
    'prettier/prettier': 'error' // Ensures Prettier rules are enforced
  }
};
