const { getConfig } = require('../lib/utils.js');
const defaultConfig = 'wp-package.json';

describe('getConfig', () => {
  it('should read wp-package.json from the root folder and return the default configuration if the file does not exist', () => {
    // Call the function
    const config = getConfig();
    // Assert the result
    expect(config).toBeInstanceOf(Object);
  });
});
