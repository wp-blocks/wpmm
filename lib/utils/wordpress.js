const path = require("path");
const fs = require("fs");
const axios = require("axios").default;
const {DefaultWpInstallFolder, DefaultWpInstallLanguage, PkgFileName} = require("../constants.js");
const {getDataFromFile} = require("./parsers");

/**
 * Determines if the provided folder is a WordPress folder.
 *
 * @param {string} currentDirectory - The folder to check for WordPress files.
 * @return {boolean} Returns true if the folder is not a WordPress folder, false otherwise.
 */
function isWordpressFolder(currentDirectory) {
  // if wp-config.php exists in the root folder or the wp-package.json file exists in the root folder
  return fs.existsSync(path.join(currentDirectory, 'wp-config.php')) || fs.existsSync(path.join(currentDirectory, PkgFileName));
}

/**
 * Gets the default paths for the WordPress installation.
 * @param {string} websiteName - The name of the WordPress installation.
 * @param {string} [baseFolder=process.cwd()] - The root folder path for the WordPress installation. Defaults to the current working directory.
 * @return {import("../constants.js").WPMMpaths} - An object containing the default paths for the WordPress installation.
 */
function getWordPressPaths(websiteName, baseFolder = process.cwd()) {

  if ( ! isWordpressFolder(baseFolder) ) {
    baseFolder = path.join(baseFolder, websiteName ?? DefaultWpInstallFolder);
  }

  return {
    tempDir: path.join(baseFolder, 'temp'),
    baseFolder: baseFolder,
    destFolder: baseFolder,
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
        'User-Agent': 'WPMM - WordPress Package Manager https://github.com/wp-blocks/wpmm',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
     * @returns {Promise<Offer|undefined>} The Last available WordPress version from WordPress.org
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

module.exports = {
  axiosFetch,
  isWordpressFolder,
  getLastWp,
  getUserLocale,
  getWordPressPaths,
  getWpConfigContent,
  getCurrentWpInfo
};
