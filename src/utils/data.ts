import fs from 'fs'
import path from 'path'
import Initialize from '../Initialize'
import { getTemplate } from './axios'
import { isWordpressFolder } from './wordpress'
import { DefaultWpInstallFolder, PkgFileName } from '../constants'
import { askForConfiguration, askForDump } from './prompts'
import { WPMMconfig, WPMMconfigWP } from '../types'

// read the version number from the package.json file
import { name, version } from '../../package.json'
import yargs from 'yargs'
import { templateGuard } from './parsers'

/**
 * Initializes the configuration for the given base folder.
 *
 * @param {string} baseFolder - The base folder where the configuration will be initialized.
 * @param {{version ?: string, language?: string}} options - The options for the initialization.
 * @returns {Promise<WPMMconfig>} - The initialized configuration object.
 */
export async function initConfig(
    baseFolder: string,
    options: { version?: string; language?: string }
): Promise<WPMMconfig> {
    // check if the output path exists
    const init = new Initialize(baseFolder)

    // generate the default config
    /**
     * the default config
     * @type {WPMMconfig} config
     */
    const config: WPMMconfig = await init.generateConfig(options)

    // create the 'wordpress' folder if it does not exist
    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder)
    }

    // write the default config to the template file
    init.writeConfig(config)

    return config
}

/**
 * Reads wp-package.json from the root folder and extracts the value of the --template option or uses the default.
 * The default config is used if no template is provided. Checks if the template file exists and reads it as JSON if it does.
 *
 * @param args - The path to the template file.
 * @return {Promise<WPMMconfig>} The configuration object.
 */
export async function getConfig(args: yargs.Argv<object>): Promise<WPMMconfig> {
    /**
     * The default config from the root plugin folder. This is used if no template is provided
     *
     * @type {WPMMconfig} config - The configuration object
     */
    let config: WPMMconfig

    // Check if the script is running from the WordPress folder
    if (!isWordpressFolder(process.cwd())) {
        console.log(
            `⚠️ Cannot find any Wordpress files in the current folder and the template file ${PkgFileName} is missing.`
        )
        // Ask the user if they want to create a new WordPress installation
        const { name, version, language } = await askForConfiguration()

        // If the template file does not exist, create it with the default config in the 'wordpress' folder
        const baseFolder = path.join(
            process.cwd(),
            name ?? DefaultWpInstallFolder
        )

        // Initialize the configuration
        return await initConfig(baseFolder, {
            version,
            language,
        })
    } else {
        if (fs.existsSync(PkgFileName)) {
            // If the template file exists, read it as JSON
            config = JSON.parse(fs.readFileSync(PkgFileName, 'utf8'))
            console.log(
                `ℹ️ The template file ${PkgFileName} exists in the root folder. Using it.`
            )
        } else {
            console.error(
                `⚠️ The template file ${PkgFileName} does not exist in the current folder.`
            )
            const newConfig = await askForDump()
            // the new config was dumped from the current WordPress installation
            if (newConfig) {
                config = newConfig
            } else {
                console.log(
                    `🔴 Script terminated. Cannot find any Wordpress information in the current folder and the template file ${PkgFileName} is missing.`
                )
                process.exit(1)
            }
        }
    }

    const template = templateGuard(args as { template?: unknown });

    // Extract the value of the --template option or use the default
    if (template) {
        /**
         * the user has provided a template file via the --template option. read the config from the remote source
         */
        const templateConfig = await getTemplate(template)

        // merge the template config with the default config
        config = { ...config, ...templateConfig }
    }

    return config
}

/**
 * Returns the connection settings based on the provided config.
 *
 * @param {WPMMconfigWP} config - The configuration object containing the host, user, password, and database details.
 * @return {{host: string, user: string, password: string, database: string}} - The connection settings object with the following properties:
 *   - connectionLimit: The maximum number of connections allowed.
 *   - host: The host name or IP address of the database server.
 *   - user: The username for authenticating with the database server.
 *   - password: The password for authenticating with the database server.
 *   - database: The name of the database to connect to.
 */
export function getConnectionSettings(config: WPMMconfigWP): {
    host: string
    user: string
    password: string
    database: string
} {
    return {
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
    }
}

/**
 * Generates the download URL for a specific version of WordPress.
 *
 * @param {string} version - The version of WordPress.
 * @param {string} language - The language for the WordPress download. Defaults to 'en'.
 * @return {string} The download URL for the specified version of WordPress.
 */
export function getWordPressDownloadUrl(version: string, language?: string): string {
    if (language && !language.startsWith('en')) {
        return `https://${language
            .slice(0, 2)
            .toLowerCase()}.wordpress.org/wordpress-${version}-${language}.zip`
    } else {
        return `https://wordpress.org/wordpress-${version}.zip`
    }
}

/**
 * Generates a download URL for a given package.
 *
 * @param {string} packageName - The name of the package.
 * @param {string=} packageVersion - The version of the package (optional).
 * @param {string=} type - The type of the package (e.g., 'plugins', 'themes').
 * @return {string} The download URL for the package.
 */
export function getDownloadUrl(
    packageName: string,
    packageVersion: string | undefined = undefined,
    type: string | undefined = 'plugins'
): string {
    // Using the absolute uri of the package
    if (
        packageName.startsWith('http://') ||
        packageName.startsWith('https://')
    ) {
        return packageName
    }

    if (packageVersion) {
        packageName = `${packageName}.${packageVersion}`
    }

    // otherwise we assume it's a repo on WordPress.org
    return `https://downloads.wordpress.org/${type}/${packageName}.zip`
}

/**
 * Retrieve information about the WPMM and system environment.
 * @return {void}
 * @param {any} config
 * @param {{}} actions
 */
export function getInfo(
    config: WPMMconfig,
    actions: {
        info?: () => void
        init?: () => Promise<void>
        install?: () => void
        update?: ({ argv }: { argv?: yargs.Argv }) => void
        dump?: () => void
        'dump-db'?: () => Promise<void>
        'dump-all'?: () => void
        'upload-db'?: () => void
    }
): void {
    console.log(`📦 ${name.toUpperCase()} v${version.toString()}`)
    console.log(`Node version: ${process.version}`)
    console.log(`OS: ${process.platform} ${process.arch}`)
    console.log(`Current working directory: ${process.cwd()}`)
    console.log('------------------------------------------')
    console.log(`🔧 Configuration: ${JSON.stringify(config, null, 2)}`)
    console.log('*******************')
    // get the keys of the actions object
    const actionsKeys = Object.keys(actions)
    console.log(
        `🚀 Command line available actions: ${JSON.stringify(
            actionsKeys,
            null,
            2
        )}`
    )
}

/**
 * Logs the time passed in milliseconds since the given start time.
 *
 * @param {number} startTime - The start time in milliseconds.
 * @return {undefined}
 */
export function printTimePassed(startTime: number): void {
    // End the timer
    const endTime = Date.now()

    // Calculate the time passed
    const timePassed = (endTime - startTime) / 1000
    console.log(`🕒 Time elapsed: ${timePassed} seconds`)
}
