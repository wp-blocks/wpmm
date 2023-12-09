/**
 * the default folder name for the WordPress install
 * @type {string} defaultWpInstallFolder - The default folder name for the WordPress install
 */
const defaultWpInstallFolder = 'wordpress';

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
  DB_HOST: '127.0.0.1',
  DB_CHARSET: 'utf8',
  DB_COLLATE: '',
  table_prefix: 'wp_',
  WP_DEBUG: true,
  WP_SITEURL: 'http://example.com',
  WP_HOME: 'http://example.com',
  WP_CONTENT_DIR: '/path/to/custom/content',
  WP_CONTENT_URL: 'http://example.com/custom/content',
  DISALLOW_FILE_EDIT: true
};

module.exports = {
  defaultWpInstallFolder,
  defaultWpInstallLanguage,
  defaultWpConfig
};
