import fs from "node:fs";
import path from "node:path";
import { Package } from "./Package.js";
import type { WPMMpaths, WordpressPkg } from "./types.js";
import { getWordPressDownloadUrl } from "./utils/data.js";
import { renameFolder } from "./utils/fs.js";
import {
	replaceDbConstant,
	replaceDbConstantBool,
	replaceEmptySalts,
} from "./utils/parsers.js";

/**
 * Represents a WordPress package that can be installed and configured.
 *
 * @class WpPackage
 * @extends Package<WpPackage> pkgConfig - the configuration object
 */
export class WpPackage extends Package {
	public pkgInfo: WordpressPkg;
	/**
	 * Constructs a new instance of the class.
	 * @param {WordpressPkg} pkgConfig - the configuration object
	 * @param {string} packageType - the type of package
	 * @param {WPMMpaths} paths - the object containing the paths
	 */
	constructor(pkgConfig: WordpressPkg, packageType: string, paths: WPMMpaths) {
		super(pkgConfig, "wordpress", paths);
		this.pkgInfo = pkgConfig;
	}

	/**
	 * Installs WordPress with the specified version and language.
	 *
	 * @param {string=} version - The version of WordPress to install.
	 * @param {string=} language - The language of WordPress to install.
	 */
	async installWordPress(
		version: string | undefined = "latest",
		language: string | undefined = "en_US",
	) {
		const downloadUrl = getWordPressDownloadUrl(version, language);

		try {
			const destinationPath = path.join(this.destFolder, this.pkgInfo.name);

			if (fs.existsSync(destinationPath)) {
				console.log("🔄 WordPress folder already exists. Skipping download.");
			} else {
				// Download WordPress
				return await this.execDownload(
					`wordpress-${version}.zip`,
					downloadUrl,
				).then(() => {
					// Copy WordPress folder to destination path
					renameFolder(path.join(this.tempDir, "wordpress"), destinationPath);
					console.log(
						`🆗 WordPress installed successfully in ${destinationPath}`,
					);
				});
			}
		} catch (error) {
			console.error("🔴 Error downloading or installing WordPress:", error);
		}
	}

	/**
	 * Sets up the WordPress configuration by copying the sample config file,
	 * replacing the placeholder values with the actual configuration values,
	 * and saving the updated config file.
	 *
	 * @return {Promise<void>} This function does not return anything.
	 */
	async setupWordPressConfig(): Promise<void> {
		const configPath = path.join(this.destFolder, "wp-config.php");

		try {
			if (fs.existsSync(configPath)) {
				console.log("🆗 WordPress configuration already set up. updating...");
			} else {
				const sampleConfigPath = path.join(
					this.destFolder,
					"wp-config-sample.php",
				);
				// Copy wp-config-sample.php to wp-config.php
				fs.copyFileSync(sampleConfigPath, configPath);
			}

			// Read the content of wp-config.php
			let configContent = fs.readFileSync(configPath, "utf8");

			// Update database name, username, password, and other settings based on user-defined config
			configContent = replaceDbConstant(
				configContent,
				"DB_NAME",
				this.pkgInfo.WP_config.DB_NAME,
			);
			configContent = replaceDbConstant(
				configContent,
				"DB_USER",
				this.pkgInfo.WP_config.DB_USER,
			);
			configContent = replaceDbConstant(
				configContent,
				"DB_PASSWORD",
				this.pkgInfo.WP_config.DB_PASSWORD,
			);
			configContent = replaceDbConstant(
				configContent,
				"DB_HOST",
				this.pkgInfo.WP_config.DB_HOST,
			);
			configContent = replaceDbConstant(
				configContent,
				"DB_CHARSET",
				this.pkgInfo.WP_config.DB_CHARSET,
			);

			configContent = replaceDbConstantBool(
				configContent,
				"WP_DEBUG",
				this.pkgInfo.WP_config.WP_DEBUG ? "TRUE" : "FALSE",
			);

			configContent = replaceEmptySalts(configContent);

			// Write the updated content back to wp-config.php
			fs.writeFileSync(configPath, configContent, "utf8");

			console.log("🆗 WordPress configuration set up successfully.");
		} catch (error) {
			console.error("🔴 Error setting up WordPress configuration:", error);
		}
	}

	/**
	 * Installs WordPress and sets up the WordPress configuration.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the installation and configuration are complete.
	 */
	async install(): Promise<void> {
		const { version, language } = this.pkgInfo;
		await this.installWordPress(version, language);
		await this.setupWordPressConfig();
	}
}
