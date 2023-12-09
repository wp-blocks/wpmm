const path = require("path");
const fs = require("fs");
const axios = require("axios");
const {defaultWpInstallFolder, defaultWpInstallLanguage, pkgFileName} = require("../constants.js");


/**
 * Gets the default paths for the WordPress installation.
 * @param {Object} config - The configuration object for the WordPress installation.
 * @param {string} [rootFolder=process.cwd()] - The root folder path for the WordPress installation. Defaults to the current working directory.
 * @return {WPMMpaths} - An object containing the default paths for the WordPress installation.
 */
function getWordPressPaths (config, rootFolder = process.cwd()) {
  /**
   * the WordPress installation folder
   *
   * @type {string}
   */
  let baseFolder = rootFolder;

  // if wp-config.php exists in the root folder or the wp-package.json file exists in the root folder
  if (! fs.existsSync(path.join(rootFolder, 'wp-config.php')) && ! fs.existsSync(path.join(rootFolder, pkgFileName))) {
    baseFolder = path.join(rootFolder, config.name ?? defaultWpInstallFolder);
  }

  return {
    tempDir: path.join(rootFolder, 'temp'),
    baseFolder: baseFolder,
    pluginsFolder: path.join(baseFolder, 'wp-content', 'plugins'),
    themeFolder: path.join(baseFolder, 'wp-content', 'themes')
  };
}

/**
 * Fetch the WordPress version from WordPress.org
 *
 * @async
 * @return {string} the version of WordPress
 */
async function getLastWp () {
  const response = await axios.get('https://api.wordpress.org/core/version-check/1.7/');

  if (response.data?.offers && response.data.offers.length > 0) {
    return response.data.offers[0];
  } else {
    throw new Error('❗Cannot get the last version available');
  }
}

/**
 * Returns the locale of the user.
 *
 * @returns {string} The locale of the user.
 */
function getUserLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale || defaultWpInstallLanguage;
}

/**
 * Reads a PHP file, extracts, and returns the WordPress version number.
 *
 * @param {string} fileContent - Path to the PHP file to read
 * @param variableName - The name of the variable to search adn replace
 *
 * @return {string|null} WordPress version number or null if not found or in case of an error
 */
function getVarFromPHPFile (fileContent, variableName = '$wp_version') {
  // Define a regular expression to match the variableName and its value with both the single and double quotes
  const versionRegex = new RegExp(`${variableName}\\s*=\\s*['"]([^'"]+)['"]`, 'g');

  // Use the regular expression to extract the version number
  const match = fileContent.match(versionRegex);

  // Return the version number or null if not found
  return match ? match[1] : null;
}

/**
 * Retrieves the WordPress version and locale information from a given WordPress folder.
 *
 * @param {string} wpFolder - The path to the WordPress folder.
 * @returns {object} - An object containing the version and locale information.
 */
function getCurrentWpInfo(wpFolder) {

  // get the WordPress version and the locale from wp-includes/version.php
  const versionFile = path.join(wpFolder, 'wp-includes', 'version.php');
  const versionFileContent = fs.readFileSync(versionFile, 'utf8');
  const version = getVarFromPHPFile(versionFileContent, 'wp_version');
  const locale = getVarFromPHPFile(versionFileContent, 'wp_local_package');
  return {
    version,
    locale
  };
}

/**
 * Replaces a constant in the wp-config.php file with a user-defined value.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @param {string} constantName - The name of the constant to replace.
 * @param {string} userDefinedValue - The user-defined value to set for the constant.
 * @return {string} - The updated content with the replaced constant.
 */
function replaceDbConstant (configContent, constantName, userDefinedValue) {
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*'[^']*'\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', '${userDefinedValue}' );`);
}

function replaceDbConstantBool (configContent, constantName, userDefinedValue) {
  // Updated regex to handle boolean constants (TRUE or FALSE)
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*[^']*\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', ${userDefinedValue} );`);
}

/**
 * Generates a random salt code for WordPress configuration.
 *
 * @return {string} - The generated salt code.
 */
function generateSalt () {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
  const saltLength = 64;
  return Array.from({ length: saltLength }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

/**
 * Replaces empty salts in the WordPress configuration with generated salt codes.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @return {string} - The updated content with replaced salts.
 */
function replaceEmptySalts (configContent) {
  const saltConstants = [
    'AUTH_KEY',
    'SECURE_AUTH_KEY',
    'LOGGED_IN_KEY',
    'NONCE_KEY',
    'AUTH_SALT',
    'SECURE_AUTH_SALT',
    'LOGGED_IN_SALT',
    'NONCE_SALT'
  ];

  saltConstants.forEach((constant) => {
    const emptySaltRegex = new RegExp(`define\\(\\s*'${constant}'\\s*,\\s*'put your unique phrase here'\\s*\\);`);
    const generatedSalt = generateSalt();
    configContent = configContent.replace(emptySaltRegex, `define( '${constant}', '${generatedSalt}' );`);
  });

  return configContent;
}

module.exports = {
  getLastWp,
  getUserLocale,
  getWordPressPaths,
  getCurrentWpInfo,
  replaceDbConstant,
  replaceDbConstantBool,
  generateSalt,
  replaceEmptySalts
};
