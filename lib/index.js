#!/usr/bin/env node
const { getConfig } = require('./utils');
const { WordPressInstaller } = require('./install');
const WordPressConfigInitializer = require('./init.js');

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Get the arguments from the command line
const argv = yargs(hideBin(process.argv)).argv;

// Get the config
const config = getConfig(argv);

// Start the timer
const startTime = Date.now();

if (argv.init === true) {
  const initializer = new WordPressConfigInitializer(this);
  initializer.init().then(() => {
    process.exit(0);
  });
} else {
  // Install WordPress
  const installer = new WordPressInstaller(config);

  installer.run().then(() => {
    console.log('🚀 WordPress installed successfully.');

    // End the timer
    const endTime = Date.now();

    // Calculate the time passed
    const timePassed = endTime - startTime;
    console.log(`🕒 Time passed: ${timePassed} milliseconds`);

    process.exit(0);
  });
}

