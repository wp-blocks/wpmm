const { isWPCLIAvailable } = require('./utils/index.js');
const { cleanup, makeDir } = require('./utils/fs.js');
const Package = require("./Package");
const { WordPressPackage } = require('./WpPackage');
const { child_process } = require('node:child_process');
const {getWordPressPaths, getLastWpVersion, getCurrentWpInfo} = require("./utils/wpConfig");
const axios = require("axios");
/**
 * The Installer class represents the WordPress installer and provides methods for installing WordPress and its dependencies.
 *
 * @class Installer
 */
class Installer {
  /**
   * Initializes a new instance of the constructor.
   *
   * @param {WPMMconfig} config - The configuration object for the constructor.
   */
  constructor (config) {
    this.config = config;

    this.paths = getWordPressPaths(config, process.cwd());
    this.tempDir = this.paths.tempDir;
    this.baseFolder = this.paths.baseFolder;
  }

  /**
   * Installs packages based on the configuration provided.
   *
   * @return {Promise} A promise that resolves when all the packages are installed.
   */
  async installPackages () {
    const { wordpress, plugins, themes, postInstall } = this.config;

    // Create temp folder
    makeDir(this.tempDir);

    const promises = [];
    const wpJson = [];

    // Install WordPress
    if (wordpress) {
      const wp = new WordPressPackage(this.config, 'wordpress', this.paths);
      await wp.install();
    }

    if (plugins) {
      const pluginPackages = plugins.map((plugin) => new Package(plugin, 'plugin', this.paths));
      promises.push(...pluginPackages.map((pluginPackage) => pluginPackage.install().then(() => {
        wpJson.push(pluginPackage.pkgInfo);
      })));
    }

    if (themes) {
      const themePackages = themes.map((theme) => new Package(theme, 'theme', this.paths));
      promises.push(...themePackages.map((themePackage) => themePackage.install.then(() => {
        wpJson.push(themePackage.pkgInfo);
      })));
    }

    // Install plugins and themes concurrently
    await Promise.all(promises);

    // Run post-install commands
    if (isWPCLIAvailable() && postInstall && postInstall.length > 0) {
      console.log('🤖 Executing post-install commands...');
      await this.runPostInstallCommands(postInstall);
    }
  }

  /**
   * Runs post-install commands asynchronously.
   *
   * @param {Array} commands - An array of WP-CLI commands to execute.
   * @return {Promise<void>} - A promise that resolves when the post-install commands complete.
   */
  async runPostInstallCommands (commands) {
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
   * Runs the function asynchronously.
   *
   * @return {Promise<void>} - A promise that resolves when the function completes.
   */
  async run () {
    await this.installPackages();
    cleanup(this.tempDir);
  }
}

module.exports = Installer;
