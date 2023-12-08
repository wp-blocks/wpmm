const { exec } = require('child_process');

class Updater {
  constructor (config) {
    // Load configuration from wp-package.json
    this.config = config;
  }

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
            console.error(`Error updating plugin ${plugin}:`, error.message);
          } else {
            console.log(`Plugin ${plugin} updated successfully`);
          }
        });
      }
    } catch (error) {
      console.error('Error updating plugins:', error.message);
    }
  }

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
            console.error(`Error updating theme ${theme}:`, error.message);
          } else {
            console.log(`Theme ${theme} updated successfully`);
          }
        });
      }
    } catch (error) {
      console.error('Error updating themes:', error.message);
    }
  }

  async updateWordPress () {
    try {
      const command = 'wp core update';

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error updating WordPress:', error.message);
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
