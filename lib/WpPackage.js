const { getWordPressDownloadUrl, replaceDbConstant, replaceDbConstantBool, replaceEmptySalts } = require('./utils/index.js');
const path = require('path');
const fs = require('fs');
const { renameFolder } = require('./utils/fs');
const Package = require('./package');

/**
 * Represents a WordPress package that can be installed and configured.
 *
 * @class WpPackage
 * @extends Package
 */
export class WpPackage extends Package {
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

module.exports = WpPackage;
