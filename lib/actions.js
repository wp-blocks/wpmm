const {getInfo} = require("./utils/data");
const Initialize = require("./Initialize");
const Installer = require("./Installer");
const Updater = require("./Updater");
const Dump = require("./Dump");
const Database = require("./Database");


/**
 * The actions object.
 *
 * @param {WPMMconfig} config - The configuration object.
 * @param {WPMMpaths} paths - The paths object.
 */
function actions({config, paths}) {
  /**
   * @function wpmmActions.info - Retrieve information using the provided configuration and actions.
   * @function wpmmActions.dump - Dumps the current WordPress installation data.
   * @function wpmmActions.init - Initialize the WordPress installation.
   * @function wpmmActions.upload-db - Upload a database by executing SQL queries from a specified file.
   * @function wpmmActions.dump-db - Dump the current WordPress database.
   * @function wpmmActions.dump-all - Dump the current WordPress database, plugins and themes setup.
   * @function wpmmActions.install - Install WordPress using the provided configuration.
   * @function wpmmActions.update - Update WordPress themes and/or plugins using the provided configuration.
   */
  const wpmmActions = {
    /** Retrieve information using the provided configuration and actions. */
    info: () => getInfo(config, wpmmActions),

    /** Initialize the WordPress installation. */
    init: () => {
      const initializer = new Initialize();
      const result = initializer.generateConfig();
      initializer.writeConfig(result);
    },

    /** Install WordPress */
    install: () => {
      const installer = new Installer(config, paths);

      installer.run().then(() => {
        console.log('🚀 WordPress installed successfully.');
      });
    },

    /** Update WordPress packages */
    update: ({argv}) => {
      const updater = new Updater(config);
      updater.run(argv).then(() => {
        console.log('🚀 WordPress updated successfully.');
      }).catch(() => {
        console.log('🔴 WordPress update failed.');
      });
    },

    /** Dumps the current WordPress installation data. This function creates a new Dump instance and initializes it. */
    dump: () => {
      const dump = new Dump(paths);
      dump.init();
    },

    /** Dump the current WordPress database. */
    'dump-db': () => {

      const db = new Database(config);
      db.dumpDatabase(paths.baseFolder).then(() => {
        console.log(`🚀 Database dumped successfully.`);
      });
    },

    /** Dump the current WordPress database, plugins and themes setup. */
    'dump-all': () => {
      actions["dump-db"]() && console.log('🚀 WP Database dumped successfully.');
      actions.dump() && console.log('🚀 All data dumped successfully.');
    },

    /** Upload a database by executing SQL queries from a specified file. */
    'upload-db': () => {
      const db = new Database(config);
      db.uploadDatabase(config.wordpress.config.DB_NAME).then(() => {
        console.log('🚀 Database uploaded successfully.');
      });
    },
  };

  return {
    invokeAction: (key, argv) => {
      if (typeof wpmmActions[key] === 'function') {
        wpmmActions[key]({config, paths, argv});
      } else {
        console.log(`Invalid action: ${key}`);
      }
    },
  };
}

module.exports = actions;
