const { isWPCLIAvailable } = require('./utils/index.js');
const { cleanup, makeDir } = require('./utils/fs.js');
const Package = require("./Package");
const { WordPressPackage } = require('./WpPackage');
const {getWordPressPaths} = require("./utils/wpConfig");
const {runPostInstallCommands} = require("./utils");

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
    const wpJson = this.config;

    // Install WordPress
    if (wordpress) {
      const wp = new WordPressPackage(this.config, 'wordpress', this.paths);
      await wp.install();
    }

    if (plugins) {
      const pluginPackages = plugins.map((plugin) => new Package(plugin, 'plugin', this.paths));
      promises.push(...pluginPackages.map((pluginPackage) => pluginPackage.install().then(() => {
        wpJson.plugins[pluginPackage.pkgInfo.name] =  pluginPackage.pkgInfo;
      })));
    }

    if (themes) {
      const themePackages = themes.map((theme) => new Package(theme, 'theme', this.paths));
      promises.push(...themePackages.map((themePackage) => themePackage.install().then(() => {
        wpJson.themes[themePackage.pkgInfo.name] =  themePackage.pkgInfo;
      })));
    }

    // Install plugins and themes concurrently
    await Promise.all(promises);

    // Run post-install commands
    if (isWPCLIAvailable() && postInstall && postInstall.length > 0) {
      console.log('🤖 Executing post-install commands...');
      await runPostInstallCommands(postInstall);
    } else {
      console.log('🔴 Unable to execute post-install commands. Please install WP-CLI and try again.');
      console.log('https://make.wordpress.org/cli/handbook/guides/installing/');
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
