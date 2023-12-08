const Package = require('./package');

/**
 * Represents a theme package.
 *
 * @class PluginPackage
 * @extends Package
 */
export class PluginPackage extends Package {
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

module.exports = PluginPackage;
