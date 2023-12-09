const path = require('path');
const fs = require('fs');
const { exec, child_process} = require('node:child_process');

/**
 * Reads a PHP file, extracts, and returns the WordPress version number.
 *
 * @param {string} fileContent - Path to the PHP file to read
 * @param variableName - The name of the variable to search adn replace
 * @return {string|null} WordPress version number or null if not found or in case of an error
 */
function geVarFromPHPFile (fileContent, variableName = '$wp_version') {
  // Define a regular expression to match the variableName and its value with both the single and double quotes
  const versionRegex = new RegExp(`${variableName}\\s*=\\s*['"]([^'"]+)['"]`, 'g');

  // Use the regular expression to extract the version number
  const match = fileContent.match(versionRegex);

  // Return the version number or null if not found
  return match ? match[1] : null;
}

/**
 * Returns the locale of the user.
 *
 * @returns {string} The locale of the user.
 */
function getUserLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

/**
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @param {any} args - The arguments object.
 * @param {string} args.template - the path to the template file
 * @return {WPMMconfig} The configuration object.
 */
function getConfig (args) {
  /**
   * The default config from the root plugin folder. This is used if no template is provided
   * @type {WPMMconfig} defaultConfig - The default configuration object
   */
  const defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..','..', 'wp-package.json'), 'utf8'));

  // Extract the value of the --template option or use the default
  const templatePath = args.template || 'wp-package.json';

  /**
   * The user-defined configuration object
   * @type {WPMMconfig} config - The configuration object
   */
  let config = defaultConfig;

  // Check if the template file exists and read it as JSON if it does
  if (!fs.existsSync(templatePath)) {
    console.error(`🔴 The template file ${templatePath} does not exist.`);
  } else {
    // Read the template file and add it to the config
    config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(templatePath, 'utf8')) };
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
 * Installs npm packages in the specified package directory.
 *
 * @param {string} packageDirectory - The directory path where the package is located.
 * @return {Promise<void>} - A promise that resolves when the packages are installed and built.
 */
async function installNpmPackages (packageDirectory) {
  const packageJsonPath = path.join(packageDirectory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    // console.warn(`Local directory (${packageDirectory}) does not contain a package.json file.`)
    return;
  }
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageName = packageData.name;
  console.log(`🚀 Installing and building ${packageName} from local directory...`);

  const packageLockPath = path.join(packageDirectory, 'package-lock.json');
  let command = 'npm i && npm run build';
  if (fs.existsSync(packageLockPath)) {
    command = 'npm ci && npm run build';
  }

  await new Promise((resolve, reject) => {
    exec(command, { cwd: packageDirectory }, (error) => {
      if (error) {
        reject(error);
      } else {
        console.log(`📦 ${packageName} dependencies installed and built.`);
        resolve();
      }
    });
  });
}

/**
 * Installs composer dependencies and generates autoloader based on composer.json file.
 *
 * @param {string} repoPath - The path to the repository where composer.json is located.
 *
 * @returns {Promise} - A promise resolving when the installation process is completed.
 */
async function installComposer (repoPath) {
  console.log('🎻 Found composer.json');
  await exec('composer install --no-dev', { cwd: repoPath });
  await exec('composer dumpautoload -o', { cwd: repoPath });
}

/**
 * Checks if WP-CLI is available.
 *
 * @return {boolean} - A promise that resolves to true if WP-CLI is available, false otherwise.
 */
async function isWPCLIAvailable () {
  try {
    // Attempt to execute a simple WP-CLI command
    await exec('wp --version');
    return true; // If successful, WP-CLI is available
  } catch (error) {
    console.log('🔴 WP-CLI is not available on this system. Please install WP-CLI and try again.');
    console.log('Read more about at https://make.wordpress.org/cli/handbook/guides/installing/');
    return false; // If an error occurs, WP-CLI is not available
  }
}

/**
 * Runs post-install commands asynchronously.
 *
 * @param {Array} commands - An array of WP-CLI commands to execute.
 * @return {Promise<void>} - A promise that resolves when the post-install commands complete.
 */
async function runPostInstallCommands (commands) {
  // Execute each post-install command
  for (const command of commands) {
    try {
      console.log(`Executing: ${command}`);
      const { stdout, stderr } = await child_process.exec(command);
      if (stdout) {
        console.log(`Command output:\n${stdout}`);
      }
      if (stderr) {
        console.error(`Command error:\n${stderr}`);
      }
    } catch (error) {
      console.error(`Error executing command: ${command}`, error);
    }
  }
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
  geVarFromPHPFile,
  getUserLocale,
  getConfig,
  getConnectionSettings,
  getWordPressDownloadUrl,
  getDownloadUrl,
  getInfo,
  installNpmPackages,
  installComposer,
  isWPCLIAvailable,
  runPostInstallCommands,
  printTimePassed
};
