const { getWordPressDownloadUrl, getDownloadUrl } = require('../lib/utils/data.js');
const { generateSalt, replaceDbConstant, replaceDbConstantBool, getDataFromFile } = require("../lib/utils/parsers.js");
const {initConfig} = require("../lib/utils/data");


describe('getConfig', () => {
  it('should read wp-package.json from the root folder and return the default configuration if the file does not exist', async () => {
    // Call the function
    const config = await initConfig( 'tests', {version: '5.7.1', language: 'en_US'});
    // Assert the result
    expect(config).toBeInstanceOf(Object);
    expect(config.wordpress).toMatchObject({"WP_config": {}, version: '5.7.1', language: 'en_US'});
    expect(config.plugins).not.toBeFalsy();
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

describe('generateSalt', () => {
  test('should return a string', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
  });

  test('should return a string of length 64', () => {
    const salt = generateSalt();
    expect(salt.length).toBe(64);
  });

  test('should only contain valid characters', () => {
    const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
    const salt = generateSalt();
    const isAllValidChars = Array.from(salt).every(char => validChars.includes(char));
    expect(isAllValidChars).toBe(true);
  });
});

// Jest Unit Tests
test('replaceConstant', () => {
  const content = "define( 'NAME', 'oldValue' );";
  const content2 = "define( 'BOOL', TRUE );";
  const name = 'NAME';
  const name2 = 'BOOL';
  const value = 'newValue';
  const value2 = 'FALSE';
  const expectedContent = "define( 'NAME', 'newValue' );";
  const expectedContent2 = "define( 'BOOL', FALSE );";

  expect(replaceDbConstant(content, name, value)).toBe(expectedContent);
  expect(replaceDbConstantBool(content2, name2, value2)).toBe(expectedContent2);
});

describe('getDownloadUrl', () => {
  test('should return absolute url if present', () => {
    expect(getDownloadUrl('http://test.com', '1.0', 'plugins')).toEqual('http://test.com');
    expect(getDownloadUrl('https://test.com', '1.0', 'plugins')).toEqual('https://test.com');
  });

  test('should return url with version if present', () => {
    expect(getDownloadUrl('test', '1.0', 'plugins')).toEqual('https://downloads.wordpress.org/plugins/test.1.0.zip');
  });

  test('should return url without version if not present', () => {
    expect(getDownloadUrl('test', undefined, 'plugins')).toEqual('https://downloads.wordpress.org/plugins/test.zip');
  });

  test('should return url for different types', () => {
    expect(getDownloadUrl('test', '1.0', 'themes')).toEqual('https://downloads.wordpress.org/themes/test.1.0.zip');
    expect(getDownloadUrl('test', '1.0', 'plugins')).toEqual('https://downloads.wordpress.org/plugins/test.1.0.zip');
  });

  test('should return url for different package names', () => {
    expect(getDownloadUrl('test1', '1.0', 'plugins')).toEqual('https://downloads.wordpress.org/plugins/test1.1.0.zip');
    expect(getDownloadUrl('test2', '2.0', 'plugins')).toEqual('https://downloads.wordpress.org/plugins/test2.2.0.zip');
  });
});

describe('getDataFromFile', () => {
  it('returns the correct version from the PHP file', () => {

    // Mock file content
    const fileContent = `$wp_version = "5.8.1";\n$wp_local_package = "en_US";`;

    // Call your function
    const version = getDataFromFile(fileContent, 'wp_version');

    // Check that the function returns the correct output
    expect(version).toBe("5.8.1");
  });

  it('returns null when the version is not found in the PHP file', () => {
    const fileContent = `$something_else = "5.8.1";`;

    const version = getDataFromFile(fileContent, 'wp_version');

    expect(version).toBe(null);
  });
});
