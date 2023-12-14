import fs from 'fs'
import path from 'path'
import {
    DefaultWpConfig,
    DefaultWpDatabaseType,
    DefaultWpInstallFolder,
    PkgFileName,
} from './constants'
import { getUserLocale } from './utils/wordpress'
import { WPMMconfig } from './types'
import { getWpVersionCheck } from './utils/axios'

/**
 * Initialize class for generating WordPress configuration file.
 *
 * @class Initialize
 */
export default class Initialize {
    /** The path to the WordPress folder. */
    private wpFolder: string

    /** The path to the output file. */
    private outputPath: string

    /**
     * Constructor for a new instance of the class.
     *
     * @param {string|undefined} wpFolder - The path to the WordPress folder.
     * @param {string|undefined} outputPath - The path to the output file.
     */
    constructor(wpFolder?: string, outputPath?: string) {
        this.wpFolder = wpFolder || process.cwd()
        this.outputPath = outputPath || path.join(this.wpFolder, PkgFileName)
    }

    /**
     * Whenever the config file exists in the output path
     *
     * @return {boolean}
     */
    hasConfig = (): boolean =>
        fs.existsSync(path.join(this.outputPath, PkgFileName))

    /**
     * Reads the configuration file.
     */
    readConfig = () => {
        if (this.hasConfig()) {
            /** @type {WPMMconfig} */
            return JSON.parse(fs.readFileSync(this.outputPath, 'utf8'))
        }
    }

    /**
     * Generates the configuration file for WordPress.
     *
     * @param {{version ?: string, language?: string}=} options - The options for the initialization.
     * @return {Promise<WPMMconfig>} The configuration object.
     */
    async generateConfig(options?: {
        version?: string
        language?: string
    }): Promise<WPMMconfig> {
        // check if the output path exists
        if (this.hasConfig()) {
            console.log(
                `👍 The configuration file ${this.outputPath} already exists.`
            )
            return this.readConfig()
        }

        const name =
            this.wpFolder.split(path.sep).pop() || DefaultWpInstallFolder

        return {
            wordpress: {
                name,
                version:
                    options?.version ||
                    (await getWpVersionCheck()).offers[0].version ||
                    'latest',
                language: options?.language || getUserLocale(),
                WP_config: DefaultWpConfig,
            },
            database: {
                type: DefaultWpDatabaseType,
                backupFolder: path.join(this.wpFolder, 'backups'),
            },
            themes: [],
            plugins: [],
            postInstall: [],
        }
    }

    /**
     * Writes the configuration file.
     *
     * @param result - The configuration object.
     */
    writeConfig = (result: WPMMconfig) => {
        // write the config to the output path
        fs.writeFileSync(this.outputPath, JSON.stringify(result, null, 2))
        console.log(
            `🆗 WordPress configuration file created. Configuration saved to ${this.outputPath}`
        )
    }
}
