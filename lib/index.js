#!/usr/bin/env node
const { getConfig } = require('./utils');
const { WordPressInstaller } = require('./install');

const config = getConfig();

// Install WordPress
const installer = new WordPressInstaller(config);

// Start the timer
const startTime = Date.now();

installer.run().then(() => {
  console.log('🚀 WordPress installed successfully.');

  // End the timer
  const endTime = Date.now();

  // Calculate the time passed
  const timePassed = endTime - startTime;
  console.log(`🕒 Time passed: ${timePassed} milliseconds`);

  process.exit(0);
});
