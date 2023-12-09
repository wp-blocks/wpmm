const fs = require('fs');
const path = require('path');
const {defaultWpConfig, defaultWpInstallFolder, pkgFileName, defaultWpDatabaseType} = require("./constants.js");
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
  constructor () {
    this.wpFolder = process.cwd();
    this.outputPath = path.join(this.wpFolder, pkgFileName);
  }

  hasConfig = () => !! fs.existsSync( path.join( this.outputPath, pkgFileName ) );

  /**
   * Generates the configuration file for WordPress.
   *
   * @return {WPMMconfig} The configuration object.
   */
  generateConfig() {

    // check if the output path exists
    if (this.hasConfig()) {
      console.log(`👍 The configuration file ${this.outputPath} already exists.`);
      return;
    }

    const name = this.wpFolder.split(path.sep).pop() || defaultWpInstallFolder;
    const lastWp = getLastWp();
    const userLocale = getUserLocale();

    return {
      name,
      wordpress: {
        version: lastWp.version,
        language: userLocale,
        config: defaultWpConfig
      },
      database: {
        type: defaultWpDatabaseType,
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
