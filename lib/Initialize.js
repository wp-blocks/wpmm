const fs = require('fs');
const path = require('path');
const {DefaultWpConfig,  DefaultWpInstallFolder, PkgFileName, DefaultWpDatabaseType} = require("./constants.js");
const {getLastWp, getUserLocale} = require("./utils/wordpress.js");

/**
 * Initialize class for generating WordPress configuration file.
 *
 * @class Initialize
 */
class Initialize {
  /**
   * Constructor for a new instance of the class.
   *
   * @param {string|undefined} wpFolder - The path to the WordPress folder.
   * @param {string|undefined} outputPath - The path to the output file.
   */
  constructor (wpFolder = undefined, outputPath = undefined) {
    this.wpFolder = wpFolder || process.cwd();
    this.outputPath = outputPath || path.join(this.wpFolder, PkgFileName);
  }

  /**
   * Whenever the config file exists in the output path
   *
   * @return {boolean}
   */
  hasConfig = () => !! fs.existsSync( path.join( this.outputPath, PkgFileName ) );

  readConfig = () => {
    if (this.hasConfig()) {
      /** @type {import('./constants.js').WPMMconfig} */
      return JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
    }
  };

  /**
   * Generates the configuration file for WordPress.
   *
   * @param {{version ?: string, language?: string}=} options - The options for the initialization.
   * @return {Promise<import('./constants.js').WPMMconfig>} The configuration object.
   */
  async generateConfig(options) {

    // check if the output path exists
    if (this.hasConfig()) {
      console.log(`👍 The configuration file ${this.outputPath} already exists.`);
      return this.readConfig();
    }

    const name = this.wpFolder.split(path.sep).pop() || DefaultWpInstallFolder;

    return {
      wordpress: {
        name,
        version: options?.version || (await getLastWp())?.version || 'latest',
        language: options?.language || getUserLocale(),
        'WP_config': DefaultWpConfig
      },
      database: {
        type: DefaultWpDatabaseType,
        backupFolder: path.join(this.wpFolder, 'backups')
      },
      themes: [],
      plugins: [],
      postInstall: []
    };
  }

  writeConfig = (/** @type {import('./constants.js').WPMMconfig} */ result) => {
    // write the config to the output path
    fs.writeFileSync(this.outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 WordPress configuration file created. Configuration saved to ${this.outputPath}`);
  };
}

module.exports = Initialize;
