/* eslint-disable */
export default {
  displayName: 'validator-hiro',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/packages/libs/validator-hiro',
  setupFiles: ['tools/bin/setup-jest.js']
};
