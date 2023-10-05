const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  setupFiles: ['<rootDir>/../../../tools/bin/setup-jest.js'],
};
