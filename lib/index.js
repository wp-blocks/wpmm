#!/usr/bin/env node
const { getConfig, printTimePassed, getInfo } = require('./utils/index.js');
const Installer = require('./installer');
const Dump = require('./dump.js');
const Database = require('./database.js');
const Initialize = require('./initialize.js');

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { getWordPressPaths } = require("./utils/wpConfig");

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

/** @var {yargs} argv - The command line arguments. */
const argv = yargs(hideBin(process.argv)).argv;

/** @var {WPMMconfig} config - The configuration object for the script. */
const config = getConfig(argv);

/** @var {number} startTime - the time at which the script started. */
const startTime = Date.now();

/**
 * The actions object.
 *
 * @param {WPMMconfig} config - The configuration object.
 * @param {Object} actions - The actions object.
 * @property {function} info - Retrieve information using the provided configuration and actions.
 * @property {function} dump - Dumps the current WordPress installation data.
 * @property {function} init - Initialize the WordPress installation.
 * @property {function} 'upload-database' - Upload a database by executing SQL queries from a specified file.
 * @property {function} 'dump-database' - Dump the current WordPress database.
 * @property {function} 'dump-all' - Dump the current WordPress database, plugins and themes setup.
 */
const actions = {

  /** Retrieve information using the provided configuration and actions. */
  info: () => {
    getInfo(config, actions);
  },

  /** Dumps the current WordPress installation data. This function creates a new Dump instance and initializes it. */
  dump: () => {
    const paths = getWordPressPaths(config);
    const dump = new Dump(paths);
    dump.init();
  },

  /** Initialize the WordPress installation. */
  init: () => {
    const initializer = new Initialize(config);
    initializer.generateConfig();
  },

  /** Upload a database by executing SQL queries from a specified file. */
  'upload-database': (file) => {
    const db = new Database(config);
    db.uploadDatabase(file || config.database.filename).then(() => {
      console.log('🚀 Database uploaded successfully.');
    });
  },

  /** Dump the current WordPress database. */
  'dump-database': () => {
    const date = new Date().getUTCDate();
    const newDbName = `${config.wordpress.config.DB_NAME}-${date}.sql.gz`;
    const db = new Database(config);
    db.dumpDatabase(newDbName).then(() => {
      console.log('🚀 Database dumped successfully to', newDbName, '.');
    });
  },

  /** Dump the current WordPress database, plugins and themes setup. */
  'dump-all': () => {
    actions["dump-database"]() && console.log('🚀 WP Database dumped successfully.');
    actions["dump"]() && console.log('🚀 All data dumped successfully.');
  },

  /** Install WordPress */
  install: () => {
    const installer = new Installer(config);

    installer.run().then(() => {
      console.log('🚀 WordPress installed successfully.');
    });
  }
};

const action = Object.keys(argv).find(key => argv[key] === true);
(!action ? actions.install : actions[action])();

printTimePassed(startTime);
process.exit(0);
