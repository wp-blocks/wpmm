const {getInfo} = require("./utils/data");
const Initialize = require("./Initialize");
const Installer = require("./Installer");
const Updater = require("./Updater");
const Dump = require("./Dump");
const Database = require("./Database");

/**
 * The actions object.
 *
 * @param {Object} props - The configuration object.
 * @param {import("./constants").WPMMconfig} props.config - The configuration object.
 * @param {import("./constants").WPMMpaths} props.paths - The paths object.
 *
 * @property {function} invokeAction - Invokes an action based on the given key and arguments.
 *
 * @return {{ invokeAction : function }}
 */
function actions({config, paths}) {
  /**
   * The actions object.
   * @typedef {Function} WpmmAction - The action function.
   * @type {{[key: string]: WpmmAction}} wpmmActions - The actions object.
   */
  const wpmmActions = {
    /** Retrieve information using the provided configuration and actions. */
    info: () => getInfo(config, wpmmActions),

    /**
     * Initialize the WordPress installation.
     * @returns {Promise<void>}
     * */
    init: async () => {
      const initializer = new Initialize();
      const result = await initializer.generateConfig();
      initializer.writeConfig(result);
    },

    /** Install WordPress */
    install: () => {
      const installer = new Installer(config, paths);

      installer.run().then(() => {
        console.log('🚀 WordPress installed successfully.');
      });
    },

    /**
     * Update WordPress packages
     *
     * @param {any} argv - The arguments object.
     */
    update: ({argv}) => {
      const updater = new Updater(config);
      updater.run(argv).then(() => {
        console.log('🚀 WordPress updated successfully.');
      }).catch(() => {
        console.log('🔴 WordPress update failed.');
      });
    },

    /** Dumps the current WordPress installation data. This function creates a new Dump instance and initializes it.*/
    dump: () => {
      const dump = new Dump(paths);
      dump.init();
    },

    /** Dump the current WordPress database. */
    'dump-db': async () => {

      const db = new Database(config);
      await db.dumpDatabase(paths.baseFolder);
      console.log(`🚀 Database dumped successfully.`);
    },

    /** Dump the current WordPress database, plugins and themes setup. */
    'dump-all': () => {
      wpmmActions["dump-db"]() || console.log('🚀 WP Database dumped successfully.');
      wpmmActions.dump() || console.log('🚀 All data dumped successfully.');
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
    /**
     * Invokes an action based on the given key and arguments.
     *
     * @function
     * @param {string} key - The key representing the action to be invoked.
     * @param {import("yargs").Argv} argv - An array of arguments to be passed to the invoked action.
     */
    invokeAction: (key, argv) => {
      if (typeof wpmmActions[key] === 'function') {
        wpmmActions[key]({config, paths, argv});
      } else {
        console.warn(`Invalid action: ${key}`);
      }
    }
  };
}

module.exports = actions;
