const path = require('path');
const { cleanup, makeDir, isWPCLIAvailable} = require('./utils');
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
    const { wordpress, plugins, themes, postInstall } = this.config;

    // Create temp folder
    makeDir(this.tempDir);

    const promises = [];

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
      promises.push(...pluginPackages.map((pluginPackage) => pluginPackage.install()));
    }

    if (themes) {
      const themePackages = themes.map((theme) => new ThemePackage(theme, { ...defaultPaths, destFolder: this.themeFolder }));
      promises.push(...themePackages.map((themePackage) => themePackage.install()));
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
  async runPostInstallCommands(commands) {
    // Execute each post-install command
    for (const command of commands) {
      try {
        console.log(`Executing: ${command}`);
        const { stdout, stderr } = await exec(command);
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

module.exports = WordPressInstaller;
