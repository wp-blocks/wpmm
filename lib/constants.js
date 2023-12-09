/**
 * the name of the WordPress package.json file
 */
const pkgFileName = 'wp-package.json';

/**
 * the default folder name for the WordPress install
 * @type {string} defaultWpInstallFolder - The default folder name for the WordPress install
 */
const defaultWpInstallFolder = 'wordpress';

const defaultWpDatabaseType = 'mysql';

/**
 * the default language for the WordPress install
 *
 * @type {string} defaultWpInstallLanguage - The default language for the WordPress install
 */
const defaultWpInstallLanguage = 'en_US';

/**
 * The default configuration object
 *
 * @type {WPMMconfig} defaultConfig - The default configuration object
 */
const defaultWpConfig = {
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
  pkgFileName,
  defaultWpInstallFolder,
  defaultWpDatabaseType,
  defaultWpInstallLanguage,
  defaultWpConfig
};
