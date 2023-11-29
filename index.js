#!/usr/bin/env node

const https = require('node:https');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const {getWordPressDownloadUrl, getDownloadUrl, installNpmPackages} = require('./utils/index.js');

class WordPressInstaller {
  /**
   * Constructor function that initializes the config, tempDir, baseFolder, pluginsFolder, and themeFolder properties.
   */
  constructor() {
    this.config = {};
    this.tempDir = path.join(__dirname, 'temp');
    this.baseFolder = path.join(__dirname, this.config.name ?? 'wordpress');
    this.pluginsFolder = path.join(this.baseFolder, 'wp-content', 'plugins');
    this.themeFolder = path.join(this.baseFolder, 'wp-content', 'themes');
  }

  /**
   * Create a temporary directory if it does not already exist.
   *
   * @param {string} tempDir - The path to the temporary directory.
   */
  makeTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, {recursive: true});
    }
  }

  /**
   * Downloads a file from the specified URL and saves it to the target file.
   *
   * @param {string} url - The URL of the file to download.
   * @param {string} targetFile - The file path where the downloaded file will be saved.
   * @return {Promise} A promise that resolves when the file is successfully downloaded and saved, or rejects with an error if there was an issue.
   */
  async downloadFile(url, targetFile) {
    this.makeTempDir();

    try {
      return await new Promise((resolve, reject) => {
        https.get(url, {headers: {'User-Agent': 'nodejs', connection: 'keep-alive', scheme: 'https', address: '127.0.0.1'}}, (response) => {
          const code = response.statusCode ?? 0;

          if (code >= 400) {
            return reject(new Error(response.statusMessage));
          }

          if (code > 300 && code < 400 && !!response.headers.location) {
            return resolve(this.downloadFile(response.headers.location, targetFile));
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
      console.log(error);
    }
  }

  /**
   * Asynchronously cleans up a temporary directory.
   *
   * @param {string} tempDir - The path to the temporary directory.
   * @return {Promise<void>} A promise that resolves when the cleanup is complete.
   */
  async cleanup(dir) {
    return fs.rm(dir, {recursive: true}, (err) => {
      if (err) {
        // File deletion failed
        console.error(err.message);
        return;
      }
      console.log(`📁 ${dir} removed successfully.`)
    })
  }

  /**
   * Extracts a zip file to a target directory.
   *
   * @param {string} zipFilePath - The path of the zip file to extract.
   * @param {string} targetDirectory - The directory to extract the zip file to.
   * @return {boolean} Returns true if the extraction is successful, false otherwise.
   */
  async extractZip(zipFilePath, targetDirectory) {
    try {
      await extract(zipFilePath, {dir: targetDirectory});
      console.log('Extraction complete');
      console.log('✅ ' + zipFilePath + ' installed successfully in ' + targetDirectory);
      return true;
    } catch (err) {
      console.log(`Error extracting WordPress zip: ${err}`);
      return false;
    }
  }

  /**
   * Executes the download process for the specified file.
   *
   * @param {string} filename - The name of the file to be downloaded.
   * @param {string} downloadUrl - The URL of the file to be downloaded.
   * @param {string|null} destinationPath - The optional path where the downloaded file should be saved.
   * @return {Promise<string>} - A promise that resolves with the path of the downloaded file.
   */
  async execDownload(filename, downloadUrl, destinationPath = null) {
    const zipFilePath = path.join(this.tempDir, filename);
    await this.downloadFile(downloadUrl, zipFilePath);
    await this.extractZip(zipFilePath, destinationPath ?? this.tempDir);

    return zipFilePath;
  }

  /**
   * Installs WordPress with the specified version and language.
   *
   * @param {string} version - The version of WordPress to install.
   * @param {string} language - The language of WordPress to install.
   * @return {boolean} Returns `true` if WordPress was installed successfully, `false` if the WordPress folder already exists.
   */
  async installWordPress(version, language) {
    const downloadUrl = getWordPressDownloadUrl(version, language);

    try {
      const destinationPath = path.join(__dirname, this.config.name);

      if (fs.existsSync(destinationPath)) {
        console.log('WordPress folder already exists');
        return false;
      }

      await this.execDownload(`wordpress-${version}.zip`, downloadUrl);

      // Rename the extracted folder from 'wordpress' to the name that matches the site name
      const wordpressFolder = path.join(this.tempDir, 'wordpress');
      fs.renameSync(wordpressFolder, destinationPath);

      console.log(`WordPress installed successfully in ${destinationPath}`);
    } catch (error) {
      console.error('Error downloading or installing WordPress:', error);
    }
  }

  /**
   * Downloads and installs a package from a specified source to the target directory.
   *
   * @param {string} packageSource - The source of the package, which can be a URL or a GitHub repository name.
   * @param {string} targetDirectory - The directory where the package will be installed.
   * @param {string} packageName - The name of the package.
   * @throws {Error} If the package source is an invalid GitHub repository name.
   * @return {Promise<void>} A promise that resolves when the package is downloaded and installed.
   */
  async downloadAndInstallPackage(packageSource, targetDirectory, packageName) {
    if (packageSource.startsWith('http://') || packageSource.startsWith('https://')) {
      await this.execDownload(packageName + ".zip", packageSource, targetDirectory);
    } else {
      if (!packageSource.includes('/')) {
        throw new Error(`Invalid GitHub repository name: ${packageSource}`);
      }
      const [user, repo] = packageSource.split('/');
      if (!user || !repo) {
        throw new Error(`Invalid GitHub repository name: ${packageSource}`);
      }
      const apiEndpoint = `https://api.github.com/repos/${user}/${repo}/zipball`;

      const zipFilePath = path.join(targetDirectory, apiEndpoint);
      await this.execDownload(repo + ".zip", zipFilePath, targetDirectory);
    }
  }

  /**
   * Asynchronously installs a theme.
   *
   * @param {string} themeName - The name of the theme to install.
   * @param {string} themeVersion - The version of the theme to install (optional).
   * @return {Promise<void>} A Promise that resolves when the theme is installed.
   */
  async installTheme(themeName, themeVersion) {
    const name = themeName;
    const targetDirectory = path.join(this.themeFolder, themeName);

    if (themeVersion) {
      themeName = `${themeName}-${themeVersion}`;
    }

    const themeUrl = getDownloadUrl(themeName, 'theme');

    await this.downloadAndInstallPackage(themeUrl, targetDirectory, name);
  }

  /**
   * Installs a plugin.
   *
   * @param {string} pluginName - The name of the plugin to install.
   * @param {string} pluginVersion - The version of the plugin to install.
   * @return {Promise<void>} A Promise that resolves when the plugin is installed.
   */
  async installPlugin(pluginName, pluginVersion) {
    const name = pluginName;
    const targetDirectory = path.join(this.pluginsFolder, pluginName);

    if (pluginVersion) {
      pluginName = `${pluginName}/${pluginName}-${pluginVersion}`;
    }

    const pluginUrl = getDownloadUrl(pluginName, 'plugin');

    await this.downloadAndInstallPackage(pluginUrl, targetDirectory, name);
  }

  /**
   * Installs packages based on the configuration provided.
   *
   * @return {Promise<void>} A promise that resolves when all packages are installed successfully.
   */
  async installPackages() {
    const {name, wordpress, themes, plugins} = this.config;

    if (wordpress) {
      await this.installWordPress(wordpress.version, wordpress.language);
    }

    if (themes) {
      themes.forEach(
        theme => this.installTheme(theme.name, theme.version)
          .then(() => console.log(`Theme ${theme.name} installed successfully.`)
          )
      );
    }

    if (plugins) {
      plugins.forEach((plugin) => {
        this.installPlugin(plugin.name, plugin.version).then(() => {
          console.log(`Plugin ${plugin.name} installed successfully.`);
        });
      });
    }
  }

  /**
   * Reads a file at the specified path and parses it as JSON.
   * Then it installs packages, and performs a cleanup.
   *
   * @param {string} path - The path to the file to be read.
   * @return {Promise} - A promise that resolves when the function completes.
   */
  async default(path) {
    this.config = JSON.parse(fs.readFileSync(path, 'utf8'));

    await this.installPackages()

    await this.cleanup(this.tempDir)
  }
}

const installer = new WordPressInstaller();
installer.default('wp-package.json');
