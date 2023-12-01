const path = require('path');
const fs = require('fs');
const { exec } = require('node:child_process');
const extract = require('extract-zip');
const https = require('node:https');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

/**
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @return {Object} The configuration object.
 */
function getConfig () {
// Read wp-package.json from the root folder
  const defaultConfigFile = path.join(process.cwd(), 'wp-package.json');
  const defaultConfig = fs.existsSync(defaultConfigFile) ? JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8')) : {};

  // Extract the value of the --template option or use the default
  const templatePath = yargs(hideBin(process.argv)).argv.template || 'wp-package.json';

  // The default config is used if no template is provided
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
 * Create a temporary directory if it does not already exist.
 */
function makeDir (dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

/**
 * Asynchronously cleans up a temporary directory.
 *
 * @param {string} dir - The path to the temporary directory.
 * @return {void} A promise that resolves when the cleanup is complete.
 */
async function cleanup (dir) {
  try {
    fs.rmSync(dir, { recursive: true });
    console.log(`🧹 ${dir} removed successfully.`);
  } catch (err) {
    // File deletion failed
    console.error(err.message);
  }
}

/**
 * Renames a folder from the old path to the new path.
 *
 * @param {string} oldPath - The path of the folder to be renamed.
 * @param {string} newPath - The new path of the folder.
 */
function renameFolder (oldPath, newPath) {
  fs.renameSync(oldPath, newPath);
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
 * Downloads a file from the specified URL and saves it to the target file.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} targetFile - The file path where the downloaded file will be saved.
 * @return {Promise<void>} A promise that resolves when the file is successfully downloaded and saved, or rejects with an error if there was an issue.
 */
async function downloadFile (url, targetFile) {
  if (fs.existsSync(targetFile)) {
    console.log(`ℹ️ ${targetFile} already exists. Skipping download.`);
    return;
  }
  try {
    return await new Promise((resolve, reject) => {
      https.get(
        url,
        { headers: { 'User-Agent': 'nodejs' } },
        async (response) => {
          const code = response.statusCode ?? 0;

          if (code >= 400) {
            return reject(new Error(response.statusMessage));
          }

          if (code > 300 && code < 400 && !!response.headers.location) {
            return resolve(await downloadFile(response.headers.location, targetFile));
          }

          const fileWriter = fs.createWriteStream(targetFile).on('finish', () => {
            resolve({});
          });

          response.pipe(fileWriter);
        }).on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Extracts a zip file to a target directory.
 *
 * @param {string} zipFilePath - The path of the zip file to extract.
 * @param {string} targetDirectory - The directory to extract the zip file to.
 * @return {Promise<string>} Returns true if the extraction is successful, false otherwise.
 */
async function extractZip (zipFilePath, targetDirectory) {
  let commonRootPath; // Variable to store the common root path

  try {
    await extract(zipFilePath, {
      dir: targetDirectory,
      onEntry: (entry) => {
        const entryPathParts = entry.fileName.split('/');

        if (!commonRootPath) {
          // Initialize the common root path with the first entry
          commonRootPath = entryPathParts[0];
        } else {
          // Update the common root path based on the current entry
          for (let i = 0; i < entryPathParts.length; i++) {
            if (commonRootPath.split('/')[i] !== entryPathParts[i]) {
              commonRootPath = commonRootPath.split('/').slice(0, i).join('/');
              break;
            }
          }
        }
      }
    });

    // Return the root folder name
    console.log(`📂 Extracted to ${commonRootPath}`);
    return commonRootPath;
  } catch (err) {
    console.error(`📛 Error extracting ${zipFilePath} zip: ${err}`);
    return err;
  }
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

module.exports = {
  getConfig,
  makeDir,
  cleanup,
  renameFolder,
  downloadFile,
  getWordPressDownloadUrl,
  getDownloadUrl,
  extractZip,
  installNpmPackages,
  installComposer,
  replaceDbConstant,
  replaceDbConstantBool,
  generateSalt,
  replaceEmptySalts,
  isWPCLIAvailable
};
