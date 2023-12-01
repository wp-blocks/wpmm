const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const {
  downloadFile,
  extractZip,
  getDownloadUrl,
  getWordPressDownloadUrl,
  installNpmPackages,
  renameFolder,
  replaceDbConstant,
  replaceEmptySalts, installComposer, replaceDbConstantBool
} = require('./utils');

class Package {
  /**
   * Constructs a new instance of the class.
   *
   * @param {Object} config - the configuration object
   * @param {string} config.name - the WordPress website name (used as root folder name)
   * @param {string} config.version - the WordPress package version
   * @param {Object} paths - the object containing the paths
   * @param {string} paths.rootFolder - the root folder of the application
   * @param {string} paths.tempDir - the temporary directory
   * @param {string} paths.baseFolder - the temporary directory
   * @param {string} paths.destFolder - The destination folder for package installation.
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
   * @param {string} targetDirectory - The directory where the package will be saved.
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
   * @param config - The configuration object.
   * @param {string} packageType - The type of the package ('theme' or 'plugin').
   * @return {Promise<void>} - A promise that resolves once the package is downloaded and installed.
   */
  async installPackage (config, packageType) {
    const { name, version, source } = config;
    const packageUrl = source || getDownloadUrl(name, version, packageType);

    await this.downloadPackage(packageUrl, name);
  }
}

class WordPressPackage extends Package {
  /**
   * Installs WordPress with the specified version and language.
   *
   * @param {string} version - The version of WordPress to install.
   * @param {string} language - The language of WordPress to install.
   */
  async installWordPress (version, language) {
    const downloadUrl = getWordPressDownloadUrl(version, language);

    try {
      const destinationPath = path.join(this.rootFolder, this.config.name);

      if (fs.existsSync(destinationPath)) {
        console.log('🔄️ WordPress folder already exists. Skipping download.');
      } else {
        // Download WordPress
        return await this.execDownload(`wordpress-${version}.zip`, downloadUrl).then(() => {
          // Copy WordPress folder to destination path
          renameFolder(path.join(this.tempDir, 'wordpress'), destinationPath);
          console.log(`🆗 WordPress installed successfully in ${destinationPath}`);
        });
      }
    } catch (error) {
      console.error('🔴 Error downloading or installing WordPress:', error);
    }
  }

  /**
   * Sets up the WordPress configuration by copying the sample config file,
   * replacing the placeholder values with the actual configuration values,
   * and saving the updated config file.
   *
   * @return {void} This function does not return anything.
   */
  async setupWordPressConfig () {
    const configPath = path.join(this.baseFolder, 'wp-config.php');

    try {
      if (fs.existsSync(configPath)) {
        console.log('🆗 WordPress configuration already set up. updating...');
      } else {
        const sampleConfigPath = path.join(this.baseFolder, 'wp-config-sample.php');
        // Copy wp-config-sample.php to wp-config.php
        fs.copyFileSync(sampleConfigPath, configPath);
      }

      // Read the content of wp-config.php
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Update database name, username, password, and other settings based on user-defined config
      configContent = replaceDbConstant(configContent, 'DB_NAME', this.config.wordpress.config.DB_NAME);
      configContent = replaceDbConstant(configContent, 'DB_USER', this.config.wordpress.config.DB_USER);
      configContent = replaceDbConstant(configContent, 'DB_PASSWORD', this.config.wordpress.config.DB_PASSWORD);
      configContent = replaceDbConstant(configContent, 'DB_HOST', this.config.wordpress.config.DB_HOST);
      configContent = replaceDbConstant(configContent, 'DB_CHARSET', this.config.wordpress.config.DB_CHARSET);

      configContent = replaceDbConstantBool(configContent, 'WP_DEBUG', this.config.wordpress.config.WP_DEBUG);

      configContent = replaceEmptySalts(configContent);

      // Write the updated content back to wp-config.php
      fs.writeFileSync(configPath, configContent, 'utf8');

      console.log('🆗 WordPress configuration set up successfully.');
    } catch (error) {
      console.error('🔴 Error setting up WordPress configuration:', error);
    }
  }

  /**
   * Installs WordPress and sets up the WordPress configuration.
   *
   * @returns {Promise} A Promise that resolves when the installation and configuration are complete.
   */
  async install () {
    const { version, language } = this.config.wordpress;
    await this.installWordPress(version, language);
    await this.setupWordPressConfig();
  }
}

class PluginPackage extends Package {
  /**
   * Asynchronously installs a plugin.
   *
   * @return {Promise<void>} A Promise that resolves when the plugin is installed successfully.
   */
  async install () {
    return await this.installPackage(this.config, 'plugin').then(() => {
      console.log(`🆗 Plugin ${this.config.name} installed successfully.`);
    });
  }
}

class ThemePackage extends Package {
  /**
   * Installs a package with the specified name and version as a theme.
   *
   * @return {Promise<void>} A promise that resolves once the package is installed.
   */
  async install () {
    return await this.installPackage(this.config, 'theme').then(() => {
      console.log(`🆗 Theme ${this.config.name} installed successfully.`);
    });
  }
}

module.exports = {
  WordPressPackage,
  PluginPackage,
  ThemePackage
};
