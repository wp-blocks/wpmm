const fs = require('fs');
const path = require('path');
const {defaultWpInstallLanguage, defaultWpConfig, defaultWpInstallFolder} = require("./constants");
const {getLastWpVersion} = require("./utils/wpConfig");
const {getUserLocale} = require("./utils");

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
    this.outputPath = path.join(this.wpFolder, 'wp-package.json');
  }

  hasConfig = () => fs.existsSync(this.outputPath);

  /**
   * Generates the configuration file for WordPress.
   *
   * @return {void}
   */
  generateConfig () {

    // check if the output path exists
    if (this.hasConfig) {
      console.error(`👍 The wp-package.json file ${this.outputPath} already exists.`);
      return;
    }

    const name = this.wpFolder.split(path.sep).pop() || defaultWpInstallFolder;
    const language = getUserLocale() || defaultWpInstallLanguage;
    const version = getLastWpVersion();
    const backupFolder = path.join(this.wpFolder, 'backups');

    const result = {
      name,
      wordpress: {
        version,
        language,
        config: defaultWpConfig
      },
      database: {
        type: "mysql",
        backupFolder: backupFolder
      },
      themes: [],
      plugins: [],
      postInstall: []
    };

    // write the config to the output path
    fs.writeFileSync(this.outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 Wordpress configuration file created. Configuration saved to ${this.outputPath}`);
  }
}

module.exports = Initialize;
