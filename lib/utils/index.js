const path = require('path');
const fs = require('fs');
const { exec } = require('node:child_process');

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
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @param {Object} args - The arguments object.
 * @param {string} args.template - the path to the template file
 * @return {WPMMconfig} The configuration object.
 */
function getConfig (args) {
  /**
   *  Read wp-package.json from the root folder
   */
  const defaultConfigFile = path.join(process.cwd(), 'wp-package.json');
  /**
   * The default config is used if no template is provided
   * @type {WPMMconfig} defaultConfig - The default configuration object
   */
  const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));

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
 * @return {object} - The connection settings object with the following properties:
 *   - connectionLimit: The maximum number of connections allowed.
 *   - host: The host name or IP address of the database server.
 *   - user: The username for authenticating with the database server.
 *   - password: The password for authenticating with the database server.
 *   - database: The name of the database to connect to.
 */
function getConnectionSettings (config) {
  return {
    connectionLimit: 5,
    host: this.config.host,
    user: this.config.user,
    password: this.config.password,
    database: this.config.database
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
 * Replaces a constant in the wp-config.php file with a user-defined value.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @param {string} constantName - The name of the constant to replace.
 * @param {string} userDefinedValue - The user-defined value to set for the constant.
 * @return {string} - The updated content with the replaced constant.
 */
function replaceDbConstant (configContent, constantName, userDefinedValue) {
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*'[^']*'\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', '${userDefinedValue}' );`);
}

function replaceDbConstantBool (configContent, constantName, userDefinedValue) {
  // Updated regex to handle boolean constants (TRUE or FALSE)
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*[^']*\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', ${userDefinedValue} );`);
}

/**
 * Generates a random salt code for WordPress configuration.
 *
 * @return {string} - The generated salt code.
 */
function generateSalt () {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
  const saltLength = 64;
  return Array.from({ length: saltLength }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

/**
 * Replaces empty salts in the WordPress configuration with generated salt codes.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @return {string} - The updated content with replaced salts.
 */
function replaceEmptySalts (configContent) {
  const saltConstants = [
    'AUTH_KEY',
    'SECURE_AUTH_KEY',
    'LOGGED_IN_KEY',
    'NONCE_KEY',
    'AUTH_SALT',
    'SECURE_AUTH_SALT',
    'LOGGED_IN_SALT',
    'NONCE_SALT'
  ];

  saltConstants.forEach((constant) => {
    const emptySaltRegex = new RegExp(`define\\(\\s*'${constant}'\\s*,\\s*'put your unique phrase here'\\s*\\);`);
    const generatedSalt = generateSalt();
    configContent = configContent.replace(emptySaltRegex, `define( '${constant}', '${generatedSalt}' );`);
  });

  return configContent;
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
 * Retrieve information about the WPMM and system environment.
 *
 * @return {void}
 */
function getInfo (config, actions) {
  const version = require('../../package.json').version;
  console.log('📦 WPMM version: ' + version.toString());
  console.log('Node version: ' + process.version);
  console.log('OS: ' + process.platform + ' ' + process.arch);
  console.log('Current working directory: ' + process.cwd());
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
  const timePassed = endTime - startTime;
  console.log(`🕒 Time passed: ${timePassed} milliseconds`);
}

module.exports = {
  geVarFromPHPFile,
  getConfig,
  getConnectionSettings,
  getWordPressDownloadUrl,
  getDownloadUrl,
  getInfo,
  installNpmPackages,
  installComposer,
  replaceDbConstant,
  replaceDbConstantBool,
  generateSalt,
  replaceEmptySalts,
  isWPCLIAvailable,
  printTimePassed
};
