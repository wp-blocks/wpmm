import { WPMMconfigWP } from './types'

/**
 * the name of the WordPress package.json file
 */
export const PkgFileName: string = 'wp-package.json'

/**
 * the default folder name for the WordPress install
 * @type {string} defaultWpInstallFolder - The default folder name for the WordPress install
 */
export const DefaultWpInstallFolder: string = 'wordpress'

export const DefaultWpDatabaseType: string = 'mysql'

/**
 * the default language for the WordPress install
 *
 * @type {string} defaultWpInstallLanguage - The default language for the WordPress install
 */
export const DefaultWpInstallLanguage: string = 'English'

/**
 * The default configuration object
 *
 * @type {WPMMconfigWP} defaultConfig - The default configuration object
 */
export const DefaultWpConfig: WPMMconfigWP = {
    DB_NAME: 'my_db_name',
    DB_USER: 'my_username',
    DB_PASSWORD: 'my_password',
    DB_HOST: 'localhost',
    DB_CHARSET: 'utf8',
    DB_COLLATE: '',
    table_prefix: 'wp_',
    WP_DEBUG: false,
}
