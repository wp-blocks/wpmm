#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { makeDir, downloadFile, cleanup, renameFolder, extractZip, getWordPressDownloadUrl, getDownloadUrl, installNpmPackages } = require('./utils/index.js')

class WordPressInstaller {
  /**
   * Constructor function that initializes the config, tempDir, baseFolder, pluginsFolder, and themeFolder properties.
   */
  constructor (config) {
    // The config object
    this.config = config

    // The temporary directory
    this.tempDir = path.join(__dirname, 'temp')

    // The base folder
    this.baseFolder = path.join(__dirname, config.name ?? 'wordpress')

    // The plugins folder
    this.pluginsFolder = path.join(this.baseFolder, 'wp-content', 'plugins')

    // The theme folder
    this.themeFolder = path.join(this.baseFolder, 'wp-content', 'themes')
  }

  /**
   * Executes the download process for the specified file.
   *
   * @param {string} filename - The name of the file to be downloaded.
   * @param {string} downloadUrl - The URL of the file to be downloaded.
   * @param {string|null} destinationPath - The optional path where the downloaded file should be saved.
   * @return {Promise<void>} - A promise that resolves with the path of the downloaded file.
   */
  async execDownload (filename, downloadUrl, destinationPath = null) {
    const zipFilePath = path.join(this.tempDir, filename)
    const zipFileName = downloadUrl.split('/').pop()
    console.log(`Downloading filename ${zipFileName} from ${downloadUrl}.zip to ${zipFilePath}`)
    // Download the zip file
    await downloadFile(downloadUrl + '.zip', zipFilePath + '.zip')
    // Extract the zip file
    const extractedPath = await extractZip(zipFilePath + '.zip', this.tempDir)
    // if the destination path provided move the files into that directory
    if (destinationPath) {
      // Move the extracted folder to the target directory
      renameFolder(path.join(this.tempDir, extractedPath), path.join(destinationPath, filename))
      // install npm packages if they exist
      return await installNpmPackages(path.join(destinationPath, filename))
    }
  }

  /**
   * Installs WordPress with the specified version and language.
   *
   * @param {string} version - The version of WordPress to install.
   * @param {string} language - The language of WordPress to install.
   * @return {Promise<void>} Returns `true` if WordPress was installed successfully, `false` if the WordPress folder already exists.
   */
  async installWordPress (version, language) {
    const downloadUrl = getWordPressDownloadUrl(version, language)

    try {
      const destinationPath = path.join(__dirname, this.config.name)

      if (fs.existsSync(destinationPath)) {
        console.log('WordPress folder already exists. Skipping download.')
      } else {
        // Download WordPress
        await this.execDownload(`wordpress-${version}`, downloadUrl)
        // Copy WordPress folder to destination path
        renameFolder(path.join(this.tempDir, 'wordpress'), destinationPath)
        console.log(`🆗 WordPress installed successfully in ${destinationPath}`)
      }
    } catch (error) {
      console.error('🔴 Error downloading or installing WordPress:', error)
    }
  }

  /**
   * Copies the wp-config-sample.php file to wp-config.php and sets up WordPress settings.
   */
  async setupWordPressConfig () {
    const sampleConfigPath = path.join(this.baseFolder, 'wp-config-sample.php')
    const configPath = path.join(this.baseFolder, 'wp-config.php')

    try {
      // Copy wp-config-sample.php to wp-config.php
      fs.copyFileSync(sampleConfigPath, configPath)

      // Read the content of wp-config.php
      let configContent = fs.readFileSync(configPath, 'utf8')

      // Update database name, username, password, and other settings based on user-defined config
      configContent = configContent.replace(/'your_database_name'/, `'${this.config.wordpress.config.DB_NAME}'`)
      configContent = configContent.replace(/'your_database_user'/, `'${this.config.wordpress.config.DB_USER}'`)
      configContent = configContent.replace(/'your_database_password'/, `'${this.config.wordpress.config.DB_PASSWORD}'`)
      configContent = configContent.replace(/'localhost'/, `'${this.config.wordpress.config.DB_HOST}'`)
      configContent = configContent.replace(/'utf8'/, `'${this.config.wordpress.config.DB_CHARSET}'`)
      // Add more replacements as needed

      // Write the updated content back to wp-config.php
      fs.writeFileSync(configPath, configContent, 'utf8')

      console.log('🆗 WordPress configuration set up successfully.')
    } catch (error) {
      console.error('🔴 Error setting up WordPress configuration:', error)
    }
  }

  /**
   * Downloads and installs a package from a specified source to the target directory.
   *
   * @param {string} packageSource - The source of the package, which can be a URL or a GitHub repository name.
   * @param {string} packageName - The name of the package.
   * @throws {Error} If the package source is an invalid GitHub repository name.
   * @return {Promise<void>} A promise that resolves when the package is downloaded and installed.
   */
  async downloadPackage (packageSource, packageName, targetDirectory) {
    if (packageSource.startsWith('http://github.com') || packageSource.startsWith('https://github.com')) {
      return await this.execDownload(packageName.split('/').pop(), packageSource, targetDirectory)
    } else {
      return await this.execDownload(packageName, packageSource, targetDirectory)
    }
  }

  /**
   * Asynchronously installs a package (theme or plugin).
   *
   * @param {string} packageName - The name of the package to install.
   * @param {string} packageVersion - The version of the package to install (optional).
   * @param {string} packageType - The type of the package ('theme' or 'plugin').
   * @return {Promise<void>} A Promise that resolves when the package is installed.
   */
  async installPackage (packageName, packageVersion, packageType) {
    const packageUrl = getDownloadUrl(packageName, packageVersion, packageType)
    const targetDirectory = packageType === 'theme' ? this.themeFolder : this.pluginsFolder

    // Download the package to the temp directory
    await this.downloadPackage(packageUrl, packageName, targetDirectory)
  }

  /**
   * Installs packages based on the configuration provided.
   *
   * @return {Promise<void>} A promise that resolves when all packages are installed successfully.
   */
  async installPackages () {
    const { wordpress, themes, plugins } = this.config

    makeDir(this.tempDir)

    if (wordpress) {
      // download and install WordPress
      await this.installWordPress(wordpress.version, wordpress.language)
      // setup WordPress
      await this.setupWordPressConfig()
    }

    if (plugins) {
      // install plugins
      await Promise.all(
        plugins.map(async (plugin) => {
          await this.installPackage(plugin.name, plugin.version, 'plugin')
          console.log(`🆗 Plugin ${plugin.name} installed successfully.`)
        })
      )
    }

    if (themes) {
      // install themes
      await Promise.all(
        themes.map(async (theme) => {
          await this.installPackage(theme.name, theme.version, 'theme')
          console.log(`🆗 Theme ${theme.name} installed successfully.`)
        })
      )
    }
  }

  /**
   * Reads a file at the specified path and parses it as JSON.
   * Then it installs packages, and performs a cleanup.
   *
   * @return {Promise} - A promise that resolves when the function completes.
   */
  async run () {
    // build wp
    await this.installPackages()
    // cleanup temp folder
    await cleanup(this.tempDir)
  }
}

// read wp-package.json
const config = JSON.parse(fs.readFileSync('wp-package.json', 'utf8'))

// install WordPress
const installer = new WordPressInstaller(config)
installer.run().then(() => {
  console.log('🚀 WordPress installed successfully.')
  process.exit(0)
})
