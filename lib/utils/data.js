const fs = require('fs');
const {get} = require("axios");
const {pkgFileName} = require("../constants.js");
const Initialize = require("../Initialize.js");

/**
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @param {any} args - The arguments object.
 * @param {string} args.template - The path to the template file.
 * @return {WPMMconfig} The configuration object.
 */
function getConfig (args) {
  /**
   * The default config from the root plugin folder. This is used if no template is provided
   *
   * @type {WPMMconfig} config - The configuration object
   */
  let config = {};

  // Extract the value of the --template option or use the default
  if (! args?.template) {
    const templatePath = pkgFileName;

    // Check if the template file exists and read it as JSON if it does
    if (!fs.existsSync(templatePath)) {
      console.log(`🔴 The template file ${templatePath} does not exist.`);
      const init = new Initialize();
      config = init.generateConfig();
    } else {
      config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      console.log(`🔴 The template file ${templatePath} exists in the root folder. Using it.`, config);
    }

  } else {
    /**
     * the user has provided a template file via the --template option. read the config from the remote source
     */
    get(args.template)
      .then(response => {
        config = response.data;
      })
      .catch(error => {
        console.log("🔴 Error: " + error.message);
      });
  }

  return config;
}

/**
 * Returns the connection settings based on the provided config.
 *
 * @param {object} config - The configuration object containing the host, user, password, and database details.
 * @return {WPMMconfig} - The connection settings object with the following properties:
 *   - connectionLimit: The maximum number of connections allowed.
 *   - host: The host name or IP address of the database server.
 *   - user: The username for authenticating with the database server.
 *   - password: The password for authenticating with the database server.
 *   - database: The name of the database to connect to.
 */
function getConnectionSettings (config) {
  return {
    connectionLimit: 5,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
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
 *
 * @return {void}
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
