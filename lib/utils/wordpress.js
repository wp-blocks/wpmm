const path = require("path");
const fs = require("fs");
const axios = require("axios").default;
const {DefaultWpInstallFolder, DefaultWpInstallLanguage, PkgFileName} = require("../constants.js");


/**
 * Gets the default paths for the WordPress installation.
 * @param {import("../constants.js").WPMMconfig} config - The configuration object for the WordPress installation.
 * @param {string} [rootFolder=process.cwd()] - The root folder path for the WordPress installation. Defaults to the current working directory.
 * @return {import("../constants.js").WPMMpaths} - An object containing the default paths for the WordPress installation.
 */
function getWordPressPaths(config, rootFolder = process.cwd()) {
  /**
   * the WordPress installation folder
   *
   * @type {string}
   */
  let baseFolder = rootFolder;

  // if wp-config.php exists in the root folder or the wp-package.json file exists in the root folder
  if (!fs.existsSync(path.join(rootFolder, 'wp-config.php')) && !fs.existsSync(path.join(rootFolder, PkgFileName))) {
    baseFolder = path.join(rootFolder, config.name ?? DefaultWpInstallFolder);
  }

  return {
    tempDir: path.join(baseFolder, 'temp'),
    baseFolder: baseFolder,
    rootFolder: rootFolder,
    destFolder: rootFolder,
    pluginsFolder: path.join(baseFolder, 'wp-content', 'plugins'),
    themeFolder: path.join(baseFolder, 'wp-content', 'themes')
  };
}

/**
 * Fetches data from the specified URL using Axios.
 *
 * @param {string} url - The URL to fetch data from.
 * @return {Promise<any>} Resolves with the fetched data if successful, otherwise logs the error to the console.
 */
async function axiosFetch(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
      }
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Fetch the WordPress version from WordPress.org
 */
async function getLastWp() {
  try {
    /**
     * @typedef {{version: string}} Offer the WordPress version
     * @typedef {{offers: Offer[]}} Offers the WordPress api response
     * @returns {Promise<Offers|undefined>} The Last available WordPress version from WordPress.org
     * @throws {Error} If the request to WordPress.org fails
     *
     * @type {Offers|undefined} The Last available WordPress version from WordPress.org
     */
    const wpApiVersions = await axiosFetch('https://api.wordpress.org/core/version-check/1.7/');
    if (wpApiVersions && wpApiVersions?.offers && wpApiVersions.offers.length > 0) {
      return wpApiVersions?.offers[0];
    } else {
      console.log('❗Cannot get the last version available from WordPress.org');
      return { version: 'latest' };
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the locale of the user.
 *
 * @returns {string} The locale of the user.
 */
function getUserLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale || DefaultWpInstallLanguage;
}

/**
 * Reads a PHP file, extracts, and returns the WordPress version number.
 *
 * @param {string} fileContent - Path to the PHP file to read
 * @param {string} variableName - The name of the variable to search adn replace
 *
 * @return {string|null} WordPress version number or null if not found or in case of an error
 */
function getDataFromFile(fileContent, variableName = 'wp_version') {
  // Define a regular expression to match the variableName and its value with both the single and double quotes
  const versionRegex = new RegExp(`${variableName}\\s*=\\s*['"]([^'"]+)['"]`, 'g');

  // Use the regular expression to extract the version number
  let match = versionRegex.exec(fileContent);

  // Return the version number or null if not found
  return match ? match[1] : null;
}

/**
 * Retrieves the WordPress version and locale information from a given WordPress folder.
 *
 * @param {string} wpFolder - The path to the WordPress folder.
 * @returns {{version: string, locale: string}} - An object containing the version and locale information.
 */
function getCurrentWpInfo(wpFolder) {

  // get the WordPress version and the locale from wp-includes/version.php
  const versionFile = path.join(wpFolder, 'wp-includes', 'version.php');
  const versionFileContent = fs.readFileSync(versionFile, 'utf8');
  const version = getDataFromFile(versionFileContent, 'wp_version') || 'latest';
  const locale = getDataFromFile(versionFileContent, 'wp_local_package') || getUserLocale();
  return {
    version,
    locale
  };
}

/**
 * Removes all commented lines from the given content.
 *
 * @param {string} content - The content that contains the lines to be uncommented.
 * @return {string} The content without any commented lines.
 */
function uncommentedLines(content) {
  const lines = content.split('\n');
  let inBlockComment = false;
  let uncommented = '';

  for (let line of lines) {
    let newLine = line;

    if (inBlockComment) {
      const endCommentIndex = newLine.indexOf('*/');
      if (endCommentIndex !== -1) {
        inBlockComment = false;
        newLine = newLine.substr(endCommentIndex + 2);
      } else {
        newLine = '';
      }
    }

    if (!inBlockComment) {
      const startCommentIndex = newLine.indexOf('/*');
      const endCommentIndex = newLine.indexOf('*/');

      if (startCommentIndex !== -1 && endCommentIndex !== -1) {
        newLine = newLine.slice(0, startCommentIndex) + newLine.slice(endCommentIndex + 2);
      } else if (startCommentIndex !== -1) {
        newLine = newLine.slice(0, startCommentIndex);
        inBlockComment = true;
      }

      const lineCommentIndex = newLine.indexOf('//');
      if (lineCommentIndex !== -1) {
        newLine = newLine.slice(0, lineCommentIndex);
      }
    }

    uncommented += newLine + '\n';
  }

  return uncommented;
}

/**
 * Retrieves the content of the wp-config.php file located in the specified WordPress folder.
 *
 * @param {string} wpFolder - The path to the WordPress folder.
 * @return {string|null} The content of the wp-config.php file, or null if the file does not exist or is empty.
 */
function getWpConfigContent(wpFolder) {

  const filePath = path.join(wpFolder, 'wp-config.php');

  if (fs.existsSync(filePath) === false) {
    console.log(`❗ wp-config.php not found in ${wpFolder}`);
    return null;
  }

  const wpConfigContent = fs.readFileSync(filePath, 'utf8');

  if (!wpConfigContent) {
    console.log(`❗ wp-config.php is empty in ${filePath}`);
    return null;
  }

  return wpConfigContent;
}

/**
 * Parses the wp-config.php file in a WordPress installation and extracts defined constants and variables.
 *
 * @param {string} wpConfigContent - The content of the wp-config.php file.
 * @return {object|null} - An object containing the extracted constants and variables, or null if there was an error parsing the file.
 */
function parseWpConfig(wpConfigContent) {

  const cleanWpConfigContent = uncommentedLines(wpConfigContent);

  // Regular expressions to match define statements
  const defineRegex = /define\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\);/gi;

  // Regular expressions to match variable assignments
  const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*=\s*["']?(.*?[^"'])["']?(?:;|\?>|\s+\?>|$)/g;

  // Extract constants
  const constantMatches = [...cleanWpConfigContent.matchAll(defineRegex)];
  /**
   * @type {Record<string, string>} constants - An object containing the extracted constants.
   */
  const constants = {};
  constantMatches.forEach(match => {
    constants[match[1]] = match[2];
  });

  // Extract variables
  const variableMatches = [...cleanWpConfigContent.matchAll(variableRegex)];

  /**
   * @type {Record<string, string>} variables - An object containing the extracted constants.
   */
  const variables = {};
  variableMatches.forEach(match => {
    variables[match[1]] = match[2];
  });

  return {constants, variables};
}

/**
 * Replaces a constant in the wp-config.php file with a user-defined value.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @param {string} constantName - The name of the constant to replace.
 * @param {string} userDefinedValue - The user-defined value to set for the constant.
 * @return {string} - The updated content with the replaced constant.
 */
function replaceDbConstant(configContent, constantName, userDefinedValue) {
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*'[^']*'\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', '${userDefinedValue}' );`);
}

/**
 * Replaces a database constant boolean value in the given configuration content.
 *
 * @param {string} configContent - The content of the configuration.
 * @param {string} constantName - The name of the constant to be replaced.
 * @param {boolean} userDefinedValue - The user-defined value to replace the constant with.
 * @return {string} The updated configuration content with the replaced constant.
 */
function replaceDbConstantBool(configContent, constantName, userDefinedValue) {
  // Updated regex to handle boolean constants (TRUE or FALSE)
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*[^']*\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', ${userDefinedValue} );`);
}

/**
 * Generates a random salt code for WordPress configuration.
 *
 * @return {string} - The generated salt code.
 */
function generateSalt() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
  const saltLength = 64;
  return Array.from({length: saltLength}, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

/**
 * Replaces empty salts in the WordPress configuration with generated salt codes.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @return {string} - The updated content with replaced salts.
 */
function replaceEmptySalts(configContent) {
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
  axiosFetch,
  getLastWp,
  getUserLocale,
  getWordPressPaths,
  getWpConfigContent,
  parseWpConfig,
  getCurrentWpInfo,
  replaceDbConstant,
  replaceDbConstantBool,
  generateSalt,
  getDataFromFile,
  replaceEmptySalts
};
