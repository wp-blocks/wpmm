const path = require('path');
const { cleanup, makeDir } = require('./utils');
const { WordPressPackage, PluginPackage, ThemePackage } = require('./package');

/**
 * The wpmm class represents the WordPress installer and provides methods for installing WordPress and its dependencies.
 */
class WordPressInstaller {
  /**
   * Initializes a new instance of the constructor.
   *
   * @param {Object} config - The configuration object for the constructor.
   */
  constructor (config) {
    this.config = config;
    this.rootFolder = process.cwd();
    this.tempDir = path.join(this.rootFolder, 'temp');
    this.baseFolder = path.join(this.rootFolder, config.name ?? 'wordpress');
    this.pluginsFolder = path.join(this.baseFolder, 'wp-content', 'plugins');
    this.themeFolder = path.join(this.baseFolder, 'wp-content', 'themes');
  }

  /**
   * Installs packages based on the configuration provided.
   *
   * @return {Promise} A promise that resolves when all the packages are installed.
   */
  async installPackages () {
    const { wordpress, plugins, themes } = this.config;

    // Create temp folder
    makeDir(this.tempDir);

    // the default paths for the packages
    const defaultPaths = {
      rootFolder: this.rootFolder,
      tempDir: this.tempDir,
      baseFolder: this.baseFolder,
      destFolder: this.baseFolder
    };

    if (wordpress) {
      const wpPackage = new WordPressPackage(this.config, defaultPaths);
      await wpPackage.install();
    }

    if (plugins) {
      const pluginPackages = plugins.map((plugin) => new PluginPackage(plugin, { ...defaultPaths, destFolder: this.pluginsFolder }));
      await Promise.all(pluginPackages.map((pluginPackage) => pluginPackage.install()));
    }

    if (themes) {
      const themePackages = themes.map((theme) => new ThemePackage(theme, { ...defaultPaths, destFolder: this.themeFolder }));
      await Promise.all(themePackages.map((themePackage) => themePackage.install()));
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

exports.WordPressInstaller = WordPressInstaller;
