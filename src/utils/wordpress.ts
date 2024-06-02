import fs from "node:fs";
import path from "node:path";
import {
	DefaultWpInstallFolder,
	DefaultWpInstallLanguage,
	PkgFileName,
} from "../constants.js";
import type { WPMMpaths } from "../types.js";
import { getDataFromFile } from "./parsers.js";

/**
 * Determines if the provided folder is a WordPress folder.
 *
 * @param {string} currentDirectory - The folder to check for WordPress files.
 * @return {boolean} Returns true if the folder is not a WordPress folder, false otherwise.
 */
export function isWordpressFolder(currentDirectory: string): boolean {
	// if wp-config.php exists in the root folder or the wp-package.json file exists in the root folder
	return (
		fs.existsSync(path.join(currentDirectory, "wp-config.php")) ||
		fs.existsSync(path.join(currentDirectory, PkgFileName))
	);
}

/**
 * Gets the default paths for the WordPress installation.
 * @param {string} websiteName - The name of the WordPress installation.
 * @param {string} [baseFolder=process.cwd()] - The root folder path for the WordPress installation. Defaults to the current working directory.
 * @return {import("../constants").WPMMpaths} - An object containing the default paths for the WordPress installation.
 */
export function getWordPressPaths(
	websiteName: string,
	baseFolder: string = process.cwd(),
): WPMMpaths {
	if (!isWordpressFolder(baseFolder)) {
		baseFolder = path.join(baseFolder, websiteName ?? DefaultWpInstallFolder);
	}

	return {
		tempDir: path.join(baseFolder, "temp"),
		baseFolder,
		destFolder: baseFolder,
		pluginsFolder: path.join(baseFolder, "wp-content", "plugins"),
		themeFolder: path.join(baseFolder, "wp-content", "themes"),
	};
}

/**
 * Returns the locale of the user.
 *
 * @returns {string} The locale of the user.
 */
export function getUserLocale(): string {
	return (
		Intl.DateTimeFormat().resolvedOptions().locale || DefaultWpInstallLanguage
	);
}

/**
 * Retrieves the WordPress version and locale information from a given WordPress folder.
 *
 * @param {string} wpFolder - The path to the WordPress folder.
 * @returns {{version: string, locale: string}} - An object containing the version and locale information.
 */
export function getCurrentWpInfo(wpFolder: string): {
	version: string;
	locale: string;
} {
	// get the WordPress version and the locale from wp-includes/version.php
	const versionFile = path.join(wpFolder, "wp-includes", "version.php");
	const versionFileContent = fs.readFileSync(versionFile, "utf8");
	const version = getDataFromFile(versionFileContent, "wp_version") || "latest";
	const locale =
		getDataFromFile(versionFileContent, "wp_local_package") || getUserLocale();
	return {
		version,
		locale,
	};
}

/**
 * Retrieves the content of the wp-config.php file located in the specified WordPress folder.
 *
 * @param {string} wpFolder - The path to the WordPress folder.
 * @return {string|null} The content of the wp-config.php file, or null if the file does not exist or is empty.
 */
export function getWpConfigContent(wpFolder: string): string | null {
	const filePath = path.join(wpFolder, "wp-config.php");

	if (!fs.existsSync(filePath)) {
		console.log(`❗ wp-config.php not found in ${wpFolder}`);
		return null;
	}

	const wpConfigContent = fs.readFileSync(filePath, "utf8");

	if (!wpConfigContent) {
		console.log(`❗ wp-config.php is empty in ${filePath}`);
		return null;
	}

	return wpConfigContent;
}
