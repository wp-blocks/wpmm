/**
 * @typedef WPMMconfigWP - The configuration object for WordPress
 * @property {string} DB_NAME - The name of the database
 * @property {string} DB_USER - The username for the database
 * @property {string} DB_PASSWORD - The password for the database
 * @property {string} DB_HOST - The host name or IP address of the database server
 * @property {string} DB_CHARSET - The character set for the database
 * @property {string} DB_COLLATE - The collation for the database (usually utf8_general_ci)
 * @property {string} table_prefix - The table prefix for the database
 * @property {boolean} WP_DEBUG - Whether to enable debugging
 * @property {string} WP_SITEURL - The URL of the website
 * @property {string} WP_HOME - The home URL of the website
 * @property {string} WP_CONTENT_DIR - The path to the content directory
 * @property {string} WP_CONTENT_URL - The URL of the content directory
 * @property {boolean} DISALLOW_FILE_EDIT - Whether to disallow file editing
 *
 * Package configuration
 * @typedef WPMMconfigPkg - The package object
 * @property {string} name - the name of the package
 * @property {string} version - the version of the package
 * @property {string} source - the source of the package
 *
 * Website configuration
 * @typedef WPMMconfig - The website configuration
 * @property {string} name - The name of the website
 * @property {Object} wordpress - The WordPress pkg related data for the website
 * @property {string} wordpress.version - The current version of WordPress
 * @property {string} wordpress.language - The language of WordPress
 * @property {WPMMconfigWP} wordpress.config - The wp-config.php file data
 * @property {WPMMconfigPkg[]} themes - The themes used
 * @property {WPMMconfigPkg[]} plugins - The plugins used
 * @property {WPMMconfigPkg[]} database - The database data
 * @property {string[]} postInstall - The post-install actions run by wp-cli
 */

/**
 * @typedef {Object} WPMMpaths - The object containing the paths
 * @property {string} rootFolder - The root folder of the application
 * @property {string} tempDir - The temporary directory
 * @property {string?} baseFolder - The path to the WordPress folder. Defaults to the current working directory.
 * @property {string} destFolder - The destination folder for package installation.
 * @property {string?} pluginsFolder - The destination folder for plugins
 * @property {string?} themeFolder - The destination folder for themes
 */

/**
 * the name of the WordPress package.json file
 */
const PkgFileName = 'wp-package.json';

/**
 * the default folder name for the WordPress install
 * @type {string} defaultWpInstallFolder - The default folder name for the WordPress install
 */
const DefaultWpInstallFolder = 'wordpress';

const DefaultWpDatabaseType = 'mysql';

/**
 * the default language for the WordPress install
 *
 * @type {string} defaultWpInstallLanguage - The default language for the WordPress install
 */
const DefaultWpInstallLanguage = 'en_US';

/**
 * The default configuration object
 *
 * @type {WPMMconfig} defaultConfig - The default configuration object
 */
const DefaultWpConfig = {
  DB_NAME: 'my_db_name',
  DB_USER: 'my_username',
  DB_PASSWORD: 'my_password',
  DB_HOST: 'localhost',
  DB_CHARSET: 'utf8',
  DB_COLLATE: '',
  table_prefix: 'wp_',
  WP_DEBUG: false
};

module.exports = {
  PkgFileName,
  DefaultWpInstallFolder,
  DefaultWpDatabaseType,
  DefaultWpInstallLanguage,
  DefaultWpConfig
};
