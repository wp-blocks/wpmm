/**
 * Removes all commented lines from the given content.
 *
 * @param {string} content - The content that contains the lines to be uncommented.
 * @return {string} The content without any commented lines.
 */
function uncommentedLines(content) {
  const lines = content.split('\n');
  let inBlockComment = false;
  let uncommented = '';

  for (let line of lines) {
    let newLine = line;

    if (inBlockComment) {
      const endCommentIndex = newLine.indexOf('*/');
      if (endCommentIndex !== -1) {
        inBlockComment = false;
        newLine = newLine.substring(endCommentIndex + 2);
      } else {
        newLine = '';
      }
    }

    if (!inBlockComment) {
      const startCommentIndex = newLine.indexOf('/*');
      const endCommentIndex = newLine.indexOf('*/');

      if (startCommentIndex !== -1 && endCommentIndex !== -1) {
        newLine = newLine.slice(0, startCommentIndex) + newLine.slice(endCommentIndex + 2);
      } else if (startCommentIndex !== -1) {
        newLine = newLine.slice(0, startCommentIndex);
        inBlockComment = true;
      }

      const lineCommentIndex = newLine.indexOf('//');
      if (lineCommentIndex !== -1) {
        newLine = newLine.slice(0, lineCommentIndex);
      }
    }

    uncommented += newLine + '\n';
  }

  return uncommented;
}

/**
 * Parses the wp-config.php file in a WordPress installation and extracts defined constants and variables.
 *
 * @param {string|null} wpConfigContent - The content of the wp-config.php file.
 * @return {{constants: Record<string, string>, variables: Record<string, string>}} - An object containing the extracted constants and variables, or null if there was an error parsing the file.
 */
function parseWpConfig(wpConfigContent) {

  if (wpConfigContent === null) {
    return {constants: {}, variables: {}};
  }

  const cleanWpConfigContent = uncommentedLines(wpConfigContent);

  // Regular expressions to match define statements
  const defineRegex = /define\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\);/gi;

  // Regular expressions to match variable assignments
  const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*=\s*["']?(.*?[^"'])["']?(?:;|\?>|\s+\?>|$)/g;

  // Extract constants
  const constantMatches = [...cleanWpConfigContent.matchAll(defineRegex)];
  /**
   * @type {Record<string, string>} constants - An object containing the extracted constants.
   */
  const constants = {};
  constantMatches.forEach(match => {
    constants[match[1]] = match[2];
  });

  // Extract variables
  const variableMatches = [...cleanWpConfigContent.matchAll(variableRegex)];

  /**
   * @type {Record<string, string>} variables - An object containing the extracted constants.
   */
  const variables = {};
  variableMatches.forEach(match => {
    variables[match[1]] = match[2];
  });

  return {constants, variables};
}

/**
 * Replaces a constant in the wp-config.php file with a user-defined value.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @param {string} constantName - The name of the constant to replace.
 * @param {string} userDefinedValue - The user-defined value to set for the constant.
 * @return {string} - The updated content with the replaced constant.
 */
function replaceDbConstant(configContent, constantName, userDefinedValue) {
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*'[^']*'\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', '${userDefinedValue}' );`);
}

/**
 * Replaces a database constant boolean value in the given configuration content.
 *
 * @param {string} configContent - The content of the configuration.
 * @param {string} constantName - The name of the constant to be replaced.
 * @param {boolean} userDefinedValue - The user-defined value to replace the constant with.
 * @return {string} The updated configuration content with the replaced constant.
 */
function replaceDbConstantBool(configContent, constantName, userDefinedValue) {
  // Updated regex to handle boolean constants (TRUE or FALSE)
  const regex = new RegExp(`define\\(\\s*'${constantName}'\\s*,\\s*[^']*\\s*\\);`);
  return configContent.replace(regex, `define( '${constantName}', ${userDefinedValue} );`);
}

/**
 * Generates a random salt code for WordPress configuration.
 *
 * @return {string} - The generated salt code.
 */
function generateSalt() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
  const saltLength = 64;
  return Array.from({length: saltLength}, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

/**
 * Replaces empty salts in the WordPress configuration with generated salt codes.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @return {string} - The updated content with replaced salts.
 */
function replaceEmptySalts(configContent) {
  const saltConstants = [
    'AUTH_KEY',
    'SECURE_AUTH_KEY',
    'LOGGED_IN_KEY',
    'NONCE_KEY',
    'AUTH_SALT',
    'SECURE_AUTH_SALT',
    'LOGGED_IN_SALT',
    'NONCE_SALT'
  ];

  saltConstants.forEach((constant) => {
    const emptySaltRegex = new RegExp(`define\\(\\s*'${constant}'\\s*,\\s*'put your unique phrase here'\\s*\\);`);
    const generatedSalt = generateSalt();
    configContent = configContent.replace(emptySaltRegex, `define( '${constant}', '${generatedSalt}' );`);
  });

  return configContent;
}

/**
 * Reads a PHP file, extracts, and returns the WordPress version number.
 *
 * @param {string} fileContent - Path to the PHP file to read
 * @param {string} variableName - The name of the variable to search adn replace
 *
 * @return {string|null} WordPress version number or null if not found or in case of an error
 */
function getDataFromFile(fileContent, variableName = 'wp_version') {
  // Define a regular expression to match the variableName and its value with both the single and double quotes
  const versionRegex = new RegExp(`${variableName}\\s*=\\s*['"]([^'"]+)['"]`, 'g');

  // Use the regular expression to extract the version number
  let match = versionRegex.exec(fileContent);

  // Return the version number or null if not found
  return match ? match[1] : null;
}

module.exports = {
  parseWpConfig,
  replaceDbConstant,
  replaceDbConstantBool,
  getDataFromFile,
  generateSalt,
  replaceEmptySalts,
  uncommentedLines
};
