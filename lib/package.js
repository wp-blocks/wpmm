const fs = require('fs');
const path = require('path');

const {
  downloadFile,
  extractZip,
  getDownloadUrl,
  getWordPressDownloadUrl,
  installNpmPackages,
  renameFolder
} = require('./utils');

class Package {
  /**
   * Constructs a new instance of the class.
   *
   * @param {Object} config - the configuration object
   * @param {string} config.name - the WordPress website name (used as root folder name)
   * @param {string} config.version - the WordPress package version
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
   * @param {string} [destinationPath] - The path where the extracted file will be placed. If not provided, the file will be extracted to a temporary directory.
   * @return {Promise<void>} A promise that resolves when the file is downloaded and extracted successfully.
   */
  async execDownload (filename, downloadUrl, destinationPath = null) {
    const zipFilePath = path.join(this.tempDir, filename);
    const zipFileName = downloadUrl.split('/').pop();
    console.log(`⬇️ Downloading filename ${zipFileName} from ${downloadUrl}.zip to ${zipFilePath}`);
    // Download the zip file
    await downloadFile(downloadUrl + '.zip', zipFilePath + '.zip');
    // Extract the zip file
    const extractedPath = await extractZip(zipFilePath + '.zip', this.tempDir);
    // if the destination path provided move the files into that directory
    if (destinationPath) {
      // Move the extracted folder to the target directory
      renameFolder(path.join(this.tempDir, extractedPath), path.join(destinationPath, filename));
      // install npm packages if they exist
      return await installNpmPackages(path.join(destinationPath, filename));
    }
  }

  /**
   * Downloads a package from a given URL and saves it to the target directory.
   *
   * @param {string} packageUrl - The URL of the package to download.
   * @param {string} packageName - The name of the package.
   * @param {string} targetDirectory - The directory where the package will be saved.
   * @return {Promise} A promise that resolves when the package is successfully downloaded and saved, or rejects with an error.
   */
  async downloadPackage (packageUrl, packageName, targetDirectory) {
    try {
      if (packageUrl.startsWith('http://github.com') || packageUrl.startsWith('https://github.com')) {
        return await this.execDownload(packageName.split('/').pop(), packageUrl, targetDirectory);
      } else {
        return await this.execDownload(packageName, packageUrl, targetDirectory);
      }
    } catch (error) {
      console.error(`🔴 Error downloading package ${packageName}:`, error);
    }
  }

  /**
   * Installs a package with the given name, version, and type.
   *
   * @param {string} packageName - The name of the package.
   * @param {string} packageVersion - The version of the package.
   * @param {string} packageType - The type of the package ('theme' or 'plugin').
   * @return {Promise<void>} - A promise that resolves once the package is downloaded and installed.
   */
  async installPackage (packageName, packageVersion, packageType) {
    const packageUrl = getDownloadUrl(packageName, packageVersion, packageType);
    const targetDirectory = this.destFolder;

    await this.downloadPackage(packageUrl, packageName, targetDirectory);
  }
}

class WordPressPackage extends Package {
  constructor (config, paths) {
    super(config, paths);
  }

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
        console.log('WordPress folder already exists. Skipping download.');
      } else {
        // Download WordPress
        await this.execDownload(`wordpress-${version}`, downloadUrl);
        // Copy WordPress folder to destination path
        renameFolder(path.join(this.tempDir, 'wordpress'), destinationPath);
        console.log(`🆗 WordPress installed successfully in ${destinationPath}`);
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
    const sampleConfigPath = path.join(this.baseFolder, 'wp-config-sample.php');
    const configPath = path.join(this.baseFolder, 'wp-config.php');

    try {
      /* check if wp-config.php exists and delete it if it does */
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log('🆗 Existing WordPress configuration file deleted.');
      }
      // Copy wp-config-sample.php to wp-config.php
      fs.copyFileSync(sampleConfigPath, configPath);
      // Read the content of wp-config.php
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Update database name, username, password, and other settings based on user-defined config
      configContent = configContent.replace(/database_name_here/, this.config.wordpress.config.DB_NAME);
      configContent = configContent.replace(/username_here/, this.config.wordpress.config.DB_USER);
      configContent = configContent.replace(/password_here/, this.config.wordpress.config.DB_PASSWORD);
      configContent = configContent.replace(/localhost/, this.config.wordpress.config.DB_HOST);
      configContent = configContent.replace(/utf8/, this.config.wordpress.config.DB_CHARSET);

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
  constructor (config, paths) {
    super(config, paths);
  }

  /**
   * Asynchronously installs a plugin.
   *
   * @return {Promise<void>} A Promise that resolves when the plugin is installed successfully.
   */
  async install () {
    const { name, version } = this.config;
    await this.installPackage(name, version, 'plugin');
    console.log(`🆗 Plugin ${name} installed successfully.`);
  }
}

class ThemePackage extends Package {
  constructor (config, paths) {
    super(config, paths);
  }

  /**
   * Installs a package with the specified name and version as a theme.
   *
   * @return {Promise<void>} A promise that resolves once the package is installed.
   */
  async install () {
    const { name, version } = this.config;
    await this.installPackage(this.config.name, this.config.version, 'theme');
    console.log(`🆗 Theme ${name} installed successfully.`);
  }
}

module.exports = {
  WordPressPackage,
  PluginPackage,
  ThemePackage
};
