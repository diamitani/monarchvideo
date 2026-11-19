import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'public/**/*',
      'node_modules/**/*',
      'src/**/*',
      'agent/**/*',
      'skills/**/*',
      'server.ts',
      'vite.config.ts',
    ],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
