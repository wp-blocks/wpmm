#!/usr/bin/env node
const { getConfig, printTimePassed } = require('./utils/data.js');
const { getWordPressPaths } = require("./utils/wordpress.js");

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const actions = require("./actions");

/** @var {number} startTime - the time at which the script started. */
const startTime = Date.now();

/** @var {import("yargs").argv} argv - The command line arguments. */
const argv = yargs(hideBin(process.argv)).argv;

getConfig(argv)
  .then(
    /** @param {import('./constants.js').WPMMconfig} config - The configuration object for the script. */
    (config) => {
      /**
       * The object that will hold the paths for the script.
       *
       * @type {import('./constants.js').WPMMpaths}
       */
      const paths = getWordPressPaths(config.wordpress.name);

      /**
       * The launcher object.
       * @typedef {{[key: string]: function}} WpmmLauncher - The launcher object.
       *
       * @type {WpmmLauncher}
       */
      const launcher = actions({config, paths});

    for (const key of Object.keys(argv)) {
      // Skip the loop iteration when the key is '_' or '$0'
      if (key === '_' || key === '$0')  continue;

      launcher.invokeAction(key, argv);
    }
  })
  .catch(
    (/** @type {Error} */ err) => console.error(err)
  )
  .finally(() => {
    /**
     * That's it 🎉! We're done! let's print how long it took to run the script and exit with a success code.
     */
    printTimePassed(startTime);
    process.exit(0);
  });

