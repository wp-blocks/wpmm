import type { UpdateObject, WPMMconfigWP } from "../types.d.ts";

/**
 * Removes all commented lines from the given content.
 *
 * @param {string} content - The content that contains the lines to be uncommented.
 * @return {string} The content without any commented lines.
 */
export function uncommentedLines(content: string): string {
	const lines = content.split("\n");
	let inBlockComment = false;
	let uncommented = "";

	for (const line of lines) {
		let newLine = line;

		if (inBlockComment) {
			const endCommentIndex = newLine.indexOf("*/");
			if (endCommentIndex !== -1) {
				inBlockComment = false;
				newLine = newLine.substring(endCommentIndex + 2);
			} else {
				newLine = "";
			}
		}

		if (!inBlockComment) {
			const startCommentIndex = newLine.indexOf("/*");
			const endCommentIndex = newLine.indexOf("*/");

			if (startCommentIndex !== -1 && endCommentIndex !== -1) {
				newLine =
					newLine.slice(0, startCommentIndex) +
					newLine.slice(endCommentIndex + 2);
			} else if (startCommentIndex !== -1) {
				newLine = newLine.slice(0, startCommentIndex);
				inBlockComment = true;
			}

			const lineCommentIndex = newLine.indexOf("//");
			if (lineCommentIndex !== -1) {
				newLine = newLine.slice(0, lineCommentIndex);
			}
		}

		uncommented += `${newLine}\n`;
	}

	return uncommented;
}

/**
 * Typeguard function to check if the given object is a valid WPMMconfigWP object.
 *
 * @param {WPMMconfigWP|unknown} obj - The object to be checked.
 * @return {boolean} Returns true if the object is a valid WPMMconfigWP object, otherwise false.
 */
export function isValidWPConfig(
	obj: WPMMconfigWP | unknown,
): obj is WPMMconfigWP {
	if (obj === null) {
		return false;
	}
	if (typeof obj !== "object") {
		return false;
	}
	if (
		typeof (obj as WPMMconfigWP)?.DB_NAME !== "string" ||
		typeof (obj as WPMMconfigWP)?.DB_USER !== "string" ||
		typeof (obj as WPMMconfigWP)?.DB_PASSWORD !== "string" ||
		typeof (obj as WPMMconfigWP)?.DB_HOST !== "string" ||
		typeof (obj as WPMMconfigWP)?.DB_CHARSET !== "string" ||
		typeof (obj as WPMMconfigWP)?.DB_COLLATE !== "string" ||
		typeof (obj as WPMMconfigWP)?.table_prefix !== "string" ||
		typeof (obj as WPMMconfigWP)?.WP_DEBUG !== "boolean"
	) {
		return false;
	}
	return true;
}

/**
 * Typeguard to check if the given object is a valid UpdateObject.
 *
 * @param {UpdateObject | object} obj - The object to be checked.
 * @return {boolean} Returns true if the object is a valid UpdateObject, false otherwise.
 */
export function isValidUpdateOptions(
	obj: UpdateObject | object,
): obj is UpdateObject {
	if (obj === null) {
		return false;
	}
	if (typeof obj !== "object") {
		return false;
	}
	if (
		typeof (obj as UpdateObject)?.all !== "boolean" ||
		typeof (obj as UpdateObject)?.wordpress !== "boolean" ||
		typeof (obj as UpdateObject)?.themes !== "boolean" ||
		typeof (obj as UpdateObject)?.plugins !== "boolean"
	) {
		return false;
	}
	return true;
}

/**
 * Typeguard to check if the given test object has a `template` property that is a string.
 *
 * @param test - The test object to check.
 * @return Returns true if the test object is a template guard, false otherwise.
 */
export function templateGuard(test: { template?: unknown }): string | false {
	return typeof test?.template === "string" ? test?.template : false;
}

/**
 * Parses the wp-config.php file in a WordPress installation and extracts defined constants and variables.
 *
 * @param {string|null} wpConfigContent - The content of the wp-config.php file.
 * @return {Record<string, string>} - An object containing the extracted constants and variables, or null if there was an error parsing the file.
 */
export function parseWpConfig(
	wpConfigContent: string | null,
): Record<string, string> {
	if (wpConfigContent === null) {
		console.error("😔 Error: wp-config.php file not found.");
		return {};
	}

	const cleanWpConfigContent = uncommentedLines(wpConfigContent);

	// Regular expressions to match define statements
	const defineRegex = /define\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\);/gi;

	// Regular expressions to match variable assignments
	const variableRegex =
		/\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*=\s*["']?(.*?[^"'])["']?(?:;|\?>|\s+\?>|$)/g;

	// Extract constants
	const constantMatches = [...cleanWpConfigContent.matchAll(defineRegex)];
	/**
	 * @type constants - An object containing the extracted constants.
	 */
	const constants: Record<string, string> = {};
	constantMatches.forEach((match: RegExpMatchArray) => {
		constants[match[1]] = match[2];
	});

	// Extract variables
	const variableMatches = [...cleanWpConfigContent.matchAll(variableRegex)];

	/**
	 * @type variables - An object containing the extracted constants.
	 */
	const variables: Record<string, string> = {};
	variableMatches.forEach((match) => {
		variables[match[1]] = match[2];
	});

	return {
		...constants,
		...variables,
	};
}

/**
 * Replaces a constant in the wp-config.php file with a user-defined value.
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @param {string} constantName - The name of the constant to replace.
 * @param {string} userDefinedValue - The user-defined value to set for the constant.
 * @return {string} - The updated content with the replaced constant.
 */
export function replaceDbConstant(
	configContent: string,
	constantName: string,
	userDefinedValue: string,
): string {
	const regex = new RegExp(
		`define\\(\\s*'${constantName}'\\s*,\\s*'[^']*'\\s*\\);`,
	);
	return configContent.replace(
		regex,
		`define( '${constantName}', '${userDefinedValue}' );`,
	);
}

/**
 * Replaces a database constant boolean value in the given configuration content.
 *
 * @param {string} configContent - The content of the configuration.
 * @param {string} constantName - The name of the constant to be replaced.
 * @param {boolean} userDefinedValue - The user-defined value to replace the constant with.
 * @return {string} The updated configuration content with the replaced constant.
 */
export function replaceDbConstantBool(
	configContent: string,
	constantName: string,
	userDefinedValue: string,
): string {
	// Updated regex to handle boolean constants (TRUE or FALSE)
	const regex = new RegExp(
		`define\\(\\s*'${constantName}'\\s*,\\s*[^']*\\s*\\);`,
	);
	return configContent.replace(
		regex,
		`define( '${constantName}', ${userDefinedValue} );`,
	);
}

/**
 * Generates a random salt code for WordPress configuration.
 *
 * @return {string} - The generated salt code.
 */
export function generateSalt(): string {
	const charset =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/";
	const saltLength = 64;
	return Array.from(
		{ length: saltLength },
		() => charset[Math.floor(Math.random() * charset.length)],
	).join("");
}

/**
 * Replaces empty salts in the WordPress configuration with generated salt codes.
 * TODO: if there are empty salts in the config file, we should fetch and use this https://api.wordpress.org/secret-key/1.1/salt/
 *
 * @param {string} configContent - The content of the wp-config.php file.
 * @return {string} - The updated content with replaced salts.
 */
export function replaceEmptySalts(configContent: string): string {
	const saltConstants = [
		"AUTH_KEY",
		"SECURE_AUTH_KEY",
		"LOGGED_IN_KEY",
		"NONCE_KEY",
		"AUTH_SALT",
		"SECURE_AUTH_SALT",
		"LOGGED_IN_SALT",
		"NONCE_SALT",
	];

	saltConstants.forEach((constant) => {
		const emptySaltRegex = new RegExp(
			`define\\(\\s*'${constant}'\\s*,\\s*'put your unique phrase here'\\s*\\);`,
		);
		const generatedSalt = generateSalt();
		configContent = configContent.replace(
			emptySaltRegex,
			`define( '${constant}', '${generatedSalt}' );`,
		);
	});

	return configContent;
}

/**
 * Reads a PHP file, extracts, and returns the WordPress version number.
 *
 * @param fileContent - Path to the PHP file to read
 * @param variableName - The name of the variable to search adn replace
 *
 * @return WordPress version number or null if not found or in case of an error
 */
export function getDataFromFile(
	fileContent: string,
	variableName = "wp_version",
): string | null {
	// Define a regular expression to match the variableName and its value with both the single and double quotes
	const versionRegex = new RegExp(
		`${variableName}\\s*=\\s*['"]([^'"]+)['"]`,
		"g",
	);

	// Use the regular expression to extract the version number
	const match = versionRegex.exec(fileContent);

	// Return the version number or null if not found
	return match ? match[1] : null;
}
