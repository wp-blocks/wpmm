const {getConfig, getWordPressDownloadUrl} = require('../lib/utils.js');
const defaultConfig = 'wp-package.json';

describe('getConfig', () => {
  it('should read wp-package.json from the root folder and return the default configuration if the file does not exist', () => {
    // Call the function
    const config = getConfig();
    // Assert the result
    expect(config).toBeInstanceOf(Object);
  });
});


describe('getWordPressDownloadUrl', () => {
  test('returns English URL when language is not provided', () => {
    expect(getWordPressDownloadUrl('5.7.1')).toBe('https://wordpress.org/wordpress-5.7.1.zip');
  });

  test('returns English URL when language starts with "en"', () => {
    expect(getWordPressDownloadUrl('5.7.1', 'en-US')).toBe('https://wordpress.org/wordpress-5.7.1.zip');
  });

  test('returns language-specific URL when language does not start with "en"', () => {
    expect(getWordPressDownloadUrl('5.7.1', 'it_IT')).toBe('https://it.wordpress.org/wordpress-5.7.1-it_IT.zip');
  });
});
