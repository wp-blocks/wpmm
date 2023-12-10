#!/usr/bin/env node
const { getConfig, printTimePassed } = require('./utils/data.js');
const { getWordPressPaths } = require("./utils/wordpress.js");

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const actions = require("./actions");

/** @var {number} startTime - the time at which the script started. */
const startTime = Date.now();

/** @var {yargs} argv - The command line arguments. */
const argv = yargs(hideBin(process.argv)).argv;

/** @var {WPMMconfig} config - The configuration object for the script. */
getConfig(argv).then(config => {

  /** @var {WPMMpaths} paths - The paths object for the script. */
  const paths = getWordPressPaths(config);

    const actionLauncher = actions(config, paths);

    for (const key of Object.keys(argv)) {
      // Skip the loop iteration when the key is '_' or '$0'
      if (key === '_' || key === '$0') {
        continue;
      }

      actionLauncher.invokeAction(key, argv);
    }

    /**
     * That's it! We're done! let's print how long it took to run the script and exit with a success code.
     */
    printTimePassed(startTime);
    process.exit(0);
});

