/**
 * The configuration object for WordPress
 */
export type WPMMconfigWP = {
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_CHARSET: string;
	DB_COLLATE: string;
	table_prefix: string;
	WP_DEBUG: boolean;
	WP_SITEURL?: string;
	WP_HOME?: string;
	WP_CONTENT_DIR?: string;
	WP_CONTENT_URL?: string;
	DISALLOW_FILE_EDIT?: boolean;
};

/**
 * The package object
 */
export type WPMMconfigPkg = {
	name: string;
	version?: string;
	source?: string;
};

/**
 * The WordPress pkg related data for the website
 */
export type WordpressPkg = {
	name: string;
	version?: string;
	source?: string;
	language?: string;
	WP_config: WPMMconfigWP;
};

/**
 * The website configuration
 */
export type WPMMconfig = {
	wordpress: WordpressPkg;
	themes: WPMMconfigPkg[];
	plugins: WPMMconfigPkg[];
	database?: {
		type?: string;
		backupFolder?: string;
	};
	postInstall?: string[];
};

/**
 * The object containing the paths
 */
export type WPMMpaths = {
	tempDir: string;
	baseFolder: string;
	destFolder: string;
	pluginsFolder: string;
	themeFolder: string;
};

/**
 * The object containing the options for the update command
 */
type UpdateObject = {
	wordpress?: boolean;
	all?: boolean;
	themes?: boolean;
	plugins?: boolean;
};

/**
 * AXIOS TYPES
 */
// get the template for wpmm given an url
interface WPapiTemplateResponse {
	data: object;
}

// get the wordpress version check json that contains the versions for the most recent updates of wordpress
interface WPapiCoreVersion {
	version: string;
}
interface WPapiCoreVersionResponse {
	offers: WPapiCoreVersion[];
}
