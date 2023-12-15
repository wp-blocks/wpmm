import fs from 'fs'
import path from 'path'
import { getCurrentWpInfo, getWpConfigContent } from './utils/wordpress'
import { isValidWPConfig, parseWpConfig } from './utils/parsers'
import type {
    WPMMconfig,
    WPMMconfigPkg,
    WPMMpaths,
} from './types'

/**
 * Represents a Dump class for WordPress configuration.
 *
 * @category Model
 */
export class Dump {
    /** The base folder of the WordPress installation. */
    protected baseFolder: string

    /** The theme folder of the WordPress installation. */
    protected themeFolder: string

    /** The plugins folder of the WordPress installation. */
    protected pluginsFolder: string

    /**
     * Constructor for the class.
     *
     * Initializes the class with the necessary folders for WordPress.
     * @param {WPMMpaths} paths - The object containing the paths for the WordPress installation.
     */
    constructor(paths: WPMMpaths) {
        this.baseFolder = paths.baseFolder
        this.themeFolder = paths.themeFolder
        this.pluginsFolder = paths.pluginsFolder
    }

    /**
     * Initializes the function by logging the `baseFolder` and `themeFolder` properties,
     * scanning the theme and plugins directories, retrieving the website name from the
     * `baseFolder` path, getting the WordPress version from `wp-includes/version.php`,
     * determining the language using `Intl.DateTimeFormat().resolvedOptions().locale`,
     * and saving the result to a JSON file.
     *
     * @return The configuration object.
     * @throws Error An error if the configuration file cannot be created.
     */
    async init(): Promise<WPMMconfig> {
        const themes = this.scanDirectory(this.themeFolder)
        const plugins = this.scanDirectory(this.pluginsFolder)

        // the website name
        const name = path.basename(this.baseFolder)

        console.log(`🔍️ Scanning ${this.baseFolder}`)
        const wpInfo: { locale: string | null; version: string | null } =
            getCurrentWpInfo(this.baseFolder)

        const WP_config = parseWpConfig(getWpConfigContent(this.baseFolder))

        // check if wp-config.php is valid
        if (isValidWPConfig(WP_config)) {
            const version = wpInfo.version || 'latest'
            const language = wpInfo.locale || 'en_US'

            const result: WPMMconfig = {
                wordpress: {
                    name,
                    version,
                    language,
                    WP_config,
                },
                themes,
                plugins,
            }

            const outputPath = path.join(process.cwd(), 'wp-package.json')

            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
            console.log(
                `🆗 Wordpress configuration Dump completed. Configuration saved to ${outputPath}`
            )

            return result
        }

        throw new Error(
            '🔴 Please make sure the wp-config.php file is valid and contains the following keys: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_CHARSET, DB_COLLATE, table_prefix, and WP_DEBUG'
        )
    }

    /**
     * Scans a directory and returns an array of objects containing the name and version of each item found.
     *
     * @param directory - The path of the directory to scan.
     * @return An array of objects with the name and version of each item found.
     */
    scanDirectory(directory: string): WPMMconfigPkg[] {
        // Check if the directory exists
        if (!fs.existsSync(directory)) {
            console.log(`⚠️ The directory ${directory} does not exist.`)
            return []
        }

        const items = fs.readdirSync(directory)

        /** The array that holds the parsed items */
        const result: WPMMconfigPkg[] = []

        for (const item of items) {
            const fullPath = path.join(directory, item)
            console.log(`🔍️ Scanning ${fullPath}`)
            const isDirectory = fs.statSync(fullPath).isDirectory()

            if (isDirectory) {
                const stylePath = path.join(fullPath, 'style.css')
                const themeFile = path.join(fullPath, `${item}.php`)
                const pluginFile = `${item}.php` // ie: 'hello-dolly.php'

                if (fs.existsSync(stylePath)) {
                    const version = this.extractVersionFromStyleFile(stylePath)
                    if (version) {
                        console.log(`ℹ️ Found ${item} version ${version}`)
                        result.push({ name: item, version })
                    }
                }

                if (fs.existsSync(themeFile) || fs.existsSync(pluginFile)) {
                    const version =
                        this.extractVersionFromPHPFile(themeFile) ||
                        this.extractVersionFromPHPFile(pluginFile)
                    if (version) {
                        console.log(`ℹ️ Found ${item} version ${version}`)
                        result.push({ name: item, version })
                    }
                }
            }
        }

        return result
    }

    /**
     * Extracts the version number from a style file.
     *
     * @param {string} filePath - The path to the style file.
     * @return {string|null} The version number extracted from the style file, or null if no match was found.
     */
    extractVersionFromStyleFile(
        filePath: fs.PathOrFileDescriptor
    ): string | null {
        const content = fs.readFileSync(filePath, 'utf8')
        const match = /Version:\s*([\d.]+)/i.exec(content)
        return match ? match[1] : null
    }

    /**
     * Extracts the version number from a PHP file.
     *
     * @param {string} filePath - The path to the PHP file.
     * @return {string|null} The version number extracted from the file, or null if no version is found.
     */
    extractVersionFromPHPFile(
        filePath: fs.PathOrFileDescriptor
    ): string | null {
        const content = fs.readFileSync(filePath, 'utf8')
        const match = /Version:\s*([\d.]+)/i.exec(content)
        return match ? match[1] : null
    }
}
