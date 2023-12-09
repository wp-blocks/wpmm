const { exec } = require('child_process');

/**
 * Represents the Updater class.
 *
 * @class Updater
 */
class Updater {
  /**
   * Constructs a new instance of the class.
   *
   * @param {WPMMconfig} config - the configuration object
   */
  constructor (config) {
    // Load configuration from wp-package.json
    this.config = config;
  }

  /**
   * Update plugins.
   *
   * @async
   * @function updatePlugins - Updates plugins using the `wp plugin install` command.
   * @throws {Error} If there is an error updating the plugins.
   */
  async updatePlugins () {
    try {
      const plugins = this.config.plugins;

      if (!plugins || !Array.isArray(plugins)) {
        console.error('Invalid or missing plugins configuration');
        return;
      }

      for (const plugin of plugins) {
        const command = `wp plugin install ${plugin} --activate`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error updating plugin ${plugin}:`, error.message, stderr, stdout);
          } else {
            console.log(`Plugin ${plugin} updated successfully`);
          }
        });
      }
    } catch (error) {
      console.error('Error updating plugins:', error.message);
    }
  }

  /**
   * Updates the themes in the configuration by installing and activating them.
   *
   * @return {void}
   */
  async updateThemes () {
    try {
      const themes = this.config.themes;

      if (!themes || !Array.isArray(themes)) {
        console.error('Invalid or missing themes configuration');
        return;
      }

      for (const theme of themes) {
        const command = `wp theme install ${theme} --activate`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error updating theme ${theme}:`, error.message, stderr, stdout);
          } else {
            console.log(`Theme ${theme} updated successfully`);
          }
        });
      }
    } catch (error) {
      console.error('Error updating themes:', error.message);
    }
  }

  /**
   * Updates the WordPress installation.
   *
   * @return {Promise} A promise that resolves when the update is complete.
   */
  async updateWordPress () {
    try {
      const command = 'wp core update';

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error updating WordPress:', error.message, stderr, stdout);
        } else {
          console.log('WordPress updated successfully');
        }
      });
    } catch (error) {
      console.error('Error updating WordPress:', error.message);
    }
  }
}

module.exports = Updater;
