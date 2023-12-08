const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
  getDownloadUrl,
  installNpmPackages,
  installComposer
} = require('./utils');

const {
  downloadFile,
  extractZip,
  renameFolder
} = require('./utils/fs');

/**
 * @typedef {Object} WPMMpaths - The object containing the paths
 * @property {string} rootFolder - The root folder of the application
 * @property {string} tempDir - The temporary directory
 * @property {string} baseFolder - The path to the WordPress folder. Defaults to the current working directory.
 * @property {string} destFolder - The destination folder for package installation.
 */

/**
 * Represents a package and provides methods to download and install it.
 *
 * @class Package
 */
class Package {
  /**
   * Constructs a new instance of the class.
   *
   * @param {WPMMconfig} config - the configuration object
   * @param {WPMMpaths} paths - the object containing the paths
   */
  constructor (config, paths) {
    this.config = config;
    this.rootFolder = paths.rootFolder;
    this.tempDir = paths.tempDir;
    this.baseFolder = paths.baseFolder;
    this.destFolder = paths.destFolder;
  }

  /**
   * Downloads a file from a given URL and extracts it to a specified destination.
   *
   * @param {string} filename - The name of the file to be downloaded.
   * @param {string} downloadUrl - The URL from which the file will be downloaded.
   * @return {Promise<string>} A promise that resolves when the file is downloaded and extracted successfully.
   */
  async execDownload (filename, downloadUrl) {
    const zipFilePath = path.join(this.tempDir, filename);
    const zipFileName = downloadUrl.split('/').pop();
    console.log(`⬇️ Downloading ${zipFileName} to ${zipFilePath} (source ${downloadUrl})`);
    // Download the zip file
    await downloadFile(downloadUrl, zipFilePath);
    // Notify the user that the download is complete
    console.log(`🆗 ${zipFileName} download completed!`);
    // Extract the zip file and return the path to the extracted folder
    return await extractZip(zipFilePath, this.tempDir);
  }

  /**
   * Asynchronously clones a repository from a given URL to a specified directory.
   *
   * @param {string} packageUrl - The URL of the repository to clone.
   * @param {string} packageName - The name of the package to be cloned.
   * @param {string} targetDirectory - The directory where the package should be cloned to.
   * @return {Promise<string>} A promise that resolves to the path of the cloned package on success, or rejects with an error on failure.
   */
  async cloneRepo (packageUrl, packageName, targetDirectory) {
    return await new Promise((resolve, reject) => {
      exec(`git clone ${packageUrl} ${targetDirectory}/${packageName}`, (error, stdout, stderr) => {
        if (error) {
          console.log('Failed to clone repository:', error);
          reject(error);
        } else {
          resolve(packageName);
        }
      });
    });
  }

  /**
   * Downloads a package from a given URL and saves it to the target directory.
   *
   * @param {string} packageUrl - The URL of the package to download.
   * @param {string} packageName - The name of the package.
   * @return {Promise} A promise that resolves when the package is successfully downloaded and saved, or rejects with an error.
   */
  async downloadPackage (packageUrl, packageName) {
    try {
      // The path of the package
      let extractedPath = '';
      // The destination folder for the package
      const destinationFolder = path.join(this.destFolder, packageName);

      if (fs.existsSync(destinationFolder)) {
        console.log(`ℹ️ destination folder ${destinationFolder} already exists. Skipping download.`);
        return;
      }

      if (packageUrl.split('.').pop() === 'git') {
        await this.cloneRepo(packageUrl, packageName, this.destFolder);
      } else {
        // Download the package
        extractedPath = await this.execDownload(packageName + '.zip', packageUrl);
        // Move the extracted folder to the target directory
        renameFolder(path.join(this.tempDir, extractedPath), destinationFolder);
      }

      console.log(`🆗 ${packageName} installed successfully in ${packageUrl}`);

      // if the destination path provided move the files into that directory
      if (packageUrl) {
        // install npm packages if they exist
        await installNpmPackages(destinationFolder);
        // install composer if exist
        await installComposer(destinationFolder);
      }
    } catch (error) {
      console.error(`🔴 Error downloading package ${packageName}:`, error);
    }
  }

  /**
   * Installs a package with the given name, version, and type.
   *
   * @param {WPMMconfig} config - The configuration object.
   * @param {string} packageType - The type of the package ('theme' or 'plugin').
   * @return {Promise<void>} - A promise that resolves once the package is downloaded and installed.
   */
  async installPackage (config, packageType) {
    const { name, version, source } = config;
    const packageUrl = source || getDownloadUrl(name, version, packageType);

    await this.downloadPackage(packageUrl, name);
  }
}

module.exports = Package;
