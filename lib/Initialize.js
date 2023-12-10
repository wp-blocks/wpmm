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
   */
  constructor (wpFolder = null, outputPath = null) {
    this.wpFolder = wpFolder || process.cwd();
    this.outputPath = outputPath || path.join(this.wpFolder, PkgFileName);
  }

  hasConfig = () => !! fs.existsSync( path.join( this.outputPath, PkgFileName ) );

  /**
   * Generates the configuration file for WordPress.
   *
   * @return {WPMMconfig} The configuration object.
   */
  async generateConfig() {

    // check if the output path exists
    if (this.hasConfig()) {
      console.log(`👍 The configuration file ${this.outputPath} already exists.`);
      return;
    }

    const name = this.wpFolder.split(path.sep).pop() || DefaultWpInstallFolder;
    const lastWp = await getLastWp();
    const userLocale = getUserLocale();

    return {
      name,
      wordpress: {
        version: lastWp.version,
        language: userLocale,
        config: DefaultWpConfig
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

  writeConfig = (result) => {
    // write the config to the output path
    fs.writeFileSync(this.outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 Wordpress configuration file created. Configuration saved to ${this.outputPath}`);
  };
}

module.exports = Initialize;
