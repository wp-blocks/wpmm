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
