const fs = require('fs');
const path = require('path');

/**
 * Initialize class for generating WordPress configuration file.
 *
 * @class Initialize
 */
class Initialize {
  /**
   * Constructor for a new instance of the class.
   *
   * @param {WPMMconfig} config - Optional configuration options.
   */
  constructor (config) {
    this.options = config || {};
    this.wpFolder = process.cwd();
    this.outputPath = path.join(this.wpFolder, 'wp-package.json');
  }

  /**
   * Generates the configuration file for WordPress.
   *
   * @return {void}
   */
  generateConfig () {
    const name = this.options.name || 'wordpress';
    const language = this.options.language || 'en_US';
    const version = this.options.version || '6.4.1';

    /**
     * The default configuration object
     *
     * @type {WPMMconfig} defaultConfig - The default configuration object
     */
    const defaultConfig = {
      DB_NAME: 'my_db_name',
      DB_USER: 'my_username',
      DB_PASSWORD: 'my_password',
      DB_HOST: '127.0.0.1',
      DB_CHARSET: 'utf8',
      DB_COLLATE: '',
      table_prefix: 'wp_',
      WP_DEBUG: true,
      WP_SITEURL: 'http://example.com',
      WP_HOME: 'http://example.com',
      WP_CONTENT_DIR: '/path/to/custom/content',
      WP_CONTENT_URL: 'http://example.com/custom/content',
      DISALLOW_FILE_EDIT: true
    };

    const customConfig = this.options.config || {};

    const result = {
      name,
      wordpress: {
        version,
        language,
        config: { ...defaultConfig, ...customConfig }
      },
      themes: [],
      plugins: [],
      postInstall: []
    };

    // check if the output path exists
    if (fs.existsSync(this.outputPath)) {
      console.error(`🔴 The configuration file ${this.outputPath} already exists.`);
      return;
    }

    // write the config to the output path
    fs.writeFileSync(this.outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 Wordpress configuration file created. Configuration saved to ${this.outputPath}`);
  }
}

module.exports = Initialize;
