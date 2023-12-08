const Package = require('./package');

export class ThemePackage extends Package {
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

module.exports = ThemePackage;
