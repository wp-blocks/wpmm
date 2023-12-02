#!/usr/bin/env node
const { getConfig, printTimePassed } = require('./utils');
const WordPressInstaller = require('./install');
const WordPressConfigDump = require('./dump.js');
const Initialize = require('./initialize.js'); // Import the Initialize class

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Get the arguments from the command line
const argv = yargs(hideBin(process.argv)).argv;

// Get the config
const config = getConfig(argv);

// Start the timer
const startTime = Date.now();

const actions = {
  dump: () => {
    const dump = new WordPressConfigDump(this);
    dump.init();
    printTimePassed(startTime);
    process.exit(0);
  },
  init: () => {
    const initializer = new Initialize(config);
    initializer.generateConfig();
    printTimePassed(startTime);
    process.exit(0);
  },
  default: () => {
    // Install WordPress
    const installer = new WordPressInstaller(config);

    installer.run().then(() => {
      console.log('🚀 WordPress installed successfully.');
      printTimePassed(startTime);
      process.exit(0);
    });
  }
};

const action = Object.keys(argv).find(key => argv[key] === true);
(actions[action] || actions.default)();
