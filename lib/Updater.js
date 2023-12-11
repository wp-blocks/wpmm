const { exec } = require('node:child_process');

/**
 * Represents the Updater class.
 *
 * @class Updater
 */
class Updater {
  /**
   * Constructs a new instance of the class.
   *
   * @param {import('./constants').WPMMconfig} config - the configuration object
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
    } catch (/** @type {any} */ error) {
      console.error('Error updating plugins:', error.message);
    }
  }

  /**
   * Updates the themes in the configuration by installing and activating them.
   *
   * @async
   * @return updateThemes - Updates themes using the `wp theme install` command.
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
    } catch (/** @type {any} */ error) {
      console.error('Error updating themes:', error.message);
    }
  }

  /**
   * Updates the WordPress installation.
   *
   * @return {Promise<void>} A promise that resolves when the update is complete.
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
    } catch (/** @type {any} */ error) {
      console.error('Error updating WordPress:', error.message);
    }
  }

  /**
   * A description of the entire function.
   *
   * @param {{wordpress: boolean, all: boolean, themes: boolean, plugins: boolean}} argv - An object containing the update options.
   *                       It should have the following properties:
   *                       - updateWordPress: boolean
   *                       - updateAll: boolean
   *                       - updateThemes: boolean
   *                       - updatePlugins: boolean
   * @return {Promise<void>} A promise that resolves when the function completes.
   *                   It does not return any value.
   */
  async run (argv) {

    /**
     * An object containing the update options.
     *
     * @typedef {{updateWordPress: boolean, updateAll: boolean, updateThemes: boolean, updatePlugins: boolean}} updateObject - An object containing the update options.
     */
    const updateObject = {
      updateAll: argv.plugins === true,
      updatePlugins: argv.plugins === true,
      updateThemes: argv.themes === true,
      updateWordPress: argv.wordpress === true,
    };

    if (updateObject.updateAll) {
      await this.updateWordPress();
      await this.updatePlugins();
      await this.updateThemes();
    } else {

      if (updateObject.updatePlugins) {
        await this.updatePlugins();
      }

      if (updateObject.updateThemes) {
        await this.updateThemes();
      }

      if (updateObject.updateWordPress) {
        await this.updateWordPress();
      }
    }

    if (!Object.values(updateObject).some(Boolean)) {
      console.log('you must specify either all, plugins, themes, or wordpress');
      console.log('ie. wpmm --update all');
    }
  }
}

module.exports = Updater;
