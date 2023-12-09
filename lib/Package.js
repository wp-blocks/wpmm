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
 * Represents a package and provides methods to download and install it.
 *
 * @class Package
 */
class Package {
  /**
   * Constructs a new instance of the class.
   *
   * @param {WPMMconfigPkg} pkgConfig - the configuration object
   * @param {string} packageType - the type of package
   * @param {WPMMpaths} paths - the object containing the paths
   */
  constructor (pkgConfig, packageType, paths) {
    this.pkgInfo = pkgConfig;
    this.packageType = packageType;
    this.rootFolder = paths.rootFolder;
    this.tempDir = paths.tempDir;
    this.destFolder = this.getDestFolder(paths, packageType);
  }

  getInfo () {
    return {
      version: this.pkgInfo.version
    };
  }

  getDestFolder (paths, packageType) {
    if (packageType === 'plugin') {
      return paths.pluginsFolder;
    } else if (packageType === 'theme') {
      return paths.themeFolder;
    }
    return paths.baseFolder;
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
   * @return {Promise<string>} A promise that resolves to the path of the cloned package on success, or rejects with an error on failure.
   */
  async cloneRepo (packageUrl) {
      return await new Promise((resolve, reject) => {
      exec(`git clone ${packageUrl} ${this.destFolder}/${this.pkgInfo.name}`, (error, stdout, stderr) => {
        if (error) {
          console.log('Failed to clone repository:', error, stdout, stderr);
          reject(error);
        } else {
          resolve(this.pkgInfo.name);
        }
      });
    });
  }

  /**
   * Downloads a package from a given URL and saves it to the target directory.
   *
   * @param {string} packageUrl - The URL of the package to download.
   * @return {Promise} A promise that resolves when the package is successfully downloaded and saved, or rejects with an error.
   */
  async downloadPackage (packageUrl) {
    try {
      // The path of the package
      let extractedPath = '';
      // The destination folder for the package
      const pkgFolder = path.join(this.destFolder, this.pkgInfo.name);

      if (fs.existsSync(pkgFolder)) {
        console.log(`ℹ️ destination folder ${pkgFolder} already exists. Skipping download.`);
        return;
      }

      if (packageUrl.split('.').pop() === 'git') {
        await this.cloneRepo(packageUrl);
      } else {
        // Download the package
        extractedPath = await this.execDownload(this.pkgInfo.name + '.zip', packageUrl);
        // Move the extracted folder to the target directory
        renameFolder(path.join(this.tempDir, extractedPath), pkgFolder);
      }

      console.log(`🆗 ${this.pkgInfo.name} installed successfully in ${packageUrl}`);

      // if the destination path provided move the files into that directory
      if (packageUrl) {
        // install npm packages if they exist
        await installNpmPackages(pkgFolder);
        // install composer if exist
        await installComposer(pkgFolder);
      }
    } catch (error) {
      console.error(`🔴 Error downloading package ${this.pkgInfo.name}:`, error);
    }
  }

  /**
   * Installs a package with the given name, version, and type.
   *
   * @return {Promise<void>} - A promise that resolves once the package is downloaded and installed.
   */
  async install () {
    const { name, version, source } = this.pkgInfo;
    const packageUrl = source || getDownloadUrl(name, version, this.packageType);

    await this.downloadPackage(packageUrl);

    console.log(`🆗 ${this.packageType} ${this.pkgInfo.name} installed successfully.`);
  }
}

module.exports = Package;
