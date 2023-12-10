const fs = require('fs');
const {PkgFileName} = require("../constants.js");
const Initialize = require("../Initialize.js");
const {DefaultWpInstallFolder} = require("../constants");
const path = require("path");
const {axiosFetch} = require("./wordpress.js");

/**
 * Initializes the configuration for the given base folder.
 *
 * @param {string} baseFolder - The base folder where the configuration will be initialized.
 * @returns {Promise<import('../constants.js').WPMMconfig>} - The initialized configuration object.
 */
async function initConfig(baseFolder) {

  const init = new Initialize(baseFolder);

  // generate the default config
  /**
   * the default config
   * @type {import('../constants.js').WPMMconfig} config
   */
  const config = await init.generateConfig();

  // create the 'wordpress' folder if it does not exist
  if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder);
  }

  // write the default config to the template file
  init.writeConfig(config);

  return config;
}

/**
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @param {any} args - The path to the template file.
 * @return {Promise<import('../constants.js').WPMMconfig>} The configuration object.
 */
async function getConfig (args) {
  /**
   * The default config from the root plugin folder. This is used if no template is provided
   *
   * @type {import('../constants.js').WPMMconfig} config - The configuration object
   */
  let config;

  // Check if the template file exists and read it as JSON if it does
  if (!fs.existsSync(PkgFileName)) {

    // TODO: prompt the user to create the template file or use the default or decide at least the folder name
    console.log(`⚠️ The template file ${PkgFileName} does not exist in the current folder.`);

    // If the template file does not exist, create it with the default config in the 'wordpress' folder
    const baseFolder = path.join(process.cwd(), DefaultWpInstallFolder);
    config = await initConfig(baseFolder);

  } else {
    // If the template file exists, read it as JSON
    config = JSON.parse(fs.readFileSync(PkgFileName, 'utf8'));
    console.log(`ℹ️ The template file ${PkgFileName} exists in the root folder. Using it.`);
  }

  // Extract the value of the --template option or use the default
  /**
   * @property {string} args.template - The path to the template file.
   */
  if (args?.template) {
    /**
     * the user has provided a template file via the --template option. read the config from the remote source
     */
    const templateContig = await axiosFetch(args.template);

    // merge the template config with the default config
    config = { ...config, ...templateContig };
  }

  return config;
}

/**
 * Returns the connection settings based on the provided config.
 *
 * @param {import('../constants.js').WPMMconfigWP} config - The configuration object containing the host, user, password, and database details.
 * @return {mysqldump.ConnectionOptions} - The connection settings object with the following properties:
 *   - connectionLimit: The maximum number of connections allowed.
 *   - host: The host name or IP address of the database server.
 *   - user: The username for authenticating with the database server.
 *   - password: The password for authenticating with the database server.
 *   - database: The name of the database to connect to.
 */
function getConnectionSettings (config) {
  return {
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
  };
}

/**
 * Generates the download URL for a specific version of WordPress.
 *
 * @param {string} version - The version of WordPress.
 * @param {string} language - The language for the WordPress download. Defaults to 'en'.
 * @return {string} The download URL for the specified version of WordPress.
 */
function getWordPressDownloadUrl (version, language) {
  if (language && !language.startsWith('en')) {
    return `https://${language.slice(0, 2).toLowerCase()}.wordpress.org/wordpress-${version}-${language}.zip`;
  } else {
    return `https://wordpress.org/wordpress-${version}.zip`;
  }
}

/**
 * Generates a download URL for a given package.
 *
 * @param {string} packageName - The name of the package.
 * @param {string} packageVersion - The version of the package (optional).
 * @param {string} type - The type of the package (e.g., 'plugins', 'themes').
 * @return {string} The download URL for the package.
 */
function getDownloadUrl (packageName, packageVersion, type) {
  // Using the absolute uri of the package
  if (packageName.startsWith('http://') || packageName.startsWith('https://')) {
    return packageName;
  }

  if (packageVersion) {
    packageName = `${packageName}.${packageVersion}`;
  }

  // otherwise we assume it's a repo on WordPress.org
  return `https://downloads.wordpress.org/${type}/${packageName}.zip`;
}

/**
 * Retrieve information about the WPMM and system environment.
 * @return {void}
 * @param {any} config
 * @param {{}} actions
 */
function getInfo (config, actions) {
  const version = require('../../package.json').version;
  console.log('📦 WPMM version: ' + version.toString());
  console.log(`Node version: ${process.version}`);
  console.log(`OS: ${process.platform} ${process.arch}`);
  console.log(`Current working directory: ${process.cwd()}`);
  console.log('------------------------------------------');
  console.log('🔧 Configuration: ' + JSON.stringify(config, null, 2));
  console.log('*******************');
  // get the keys of the actions object
  const actionsKeys = Object.keys(actions);
  console.log('🚀 Command line available actions: ' + JSON.stringify(actionsKeys, null, 2));
}

/**
 * Logs the time passed in milliseconds since the given start time.
 *
 * @param {number} startTime - The start time in milliseconds.
 * @return {undefined}
 */
function printTimePassed (startTime) {
  // End the timer
  const endTime = Date.now();

  // Calculate the time passed
  const timePassed = (endTime - startTime) / 1000;
  console.log(`🕒 Time elapsed: ${timePassed} seconds`);
}

module.exports = {
  getConfig,
  getInfo,
  getConnectionSettings,
  getWordPressDownloadUrl,
  getDownloadUrl,
  printTimePassed
};
