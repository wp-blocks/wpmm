import { cleanup, makeDir } from './utils/fs'
import { Package } from './Package'
import { WpPackage } from './WpPackage'
import { isWPCLIAvailable, runPostInstallCommands } from './utils/commands'
import { WPMMconfig, WPMMpaths } from './types'

/**
 * The Installer class represents the WordPress installer and provides methods for installing WordPress and its dependencies.
 *
 * @class Installer
 */
export class Installer {
    /** The configuration object. */
    protected config: WPMMconfig

    /** The object containing the paths. */
    protected paths: WPMMpaths

    /** The temporary directory. */
    protected tempDir: string

    /** The base folder. */
    protected baseFolder: string

    /**
     * Initializes a new instance of the constructor.
     *
     * @param {WPMMconfig} config - The configuration object for the constructor.
     * @param {WPMMpaths} paths - The object containing the paths for the constructor.
     */
    constructor(config: WPMMconfig, paths: WPMMpaths) {
        this.config = config

        this.paths = paths
        this.tempDir = this.paths.tempDir
        this.baseFolder = this.paths.baseFolder
    }

    /**
     * Installs packages based on the configuration provided.
     *
     * @return {Promise<void>} A promise that resolves when all the packages are installed.
     */
    async installPackages(): Promise<void> {
        const { wordpress, plugins, themes, postInstall } = this.config

        // Create temp folder
        makeDir(this.tempDir)

        const promises = []
        const wpJson = this.config

        // Install WordPress
        if (wordpress) {
            const wp = new WpPackage(
                this.config.wordpress,
                'wordpress',
                this.paths
            )
            await wp.install()
        }

        if (plugins) {
            const pluginPackages = plugins.map(
                (plugin) => new Package(plugin, 'plugin', this.paths)
            )
            promises.push(
                ...pluginPackages.map((pluginPackage) =>
                    pluginPackage.install().then(() => {
                        wpJson.plugins.push(pluginPackage.pkgInfo)
                    })
                )
            )
        }

        if (themes) {
            const themePackages = themes.map(
                (theme) => new Package(theme, 'theme', this.paths)
            )
            promises.push(
                ...themePackages.map((themePackage) =>
                    themePackage.install().then(() => {
                        wpJson.themes.push(themePackage.pkgInfo)
                    })
                )
            )
        }

        // Install plugins and themes concurrently
        await Promise.all(promises)

        // Run post-install commands
        if (isWPCLIAvailable() && postInstall && postInstall.length > 0) {
            console.log('🤖 Executing post-install commands...')
            await runPostInstallCommands(postInstall)
        } else {
            console.log(
                '🔴 Unable to execute post-install commands. Please install WP-CLI and try again.'
            )
            console.log(
                'more info here: https://make.wordpress.org/cli/handbook/guides/installing/'
            )
        }
    }

    /**
     * Runs the function asynchronously.
     *
     * @return {Promise<void>} - A promise that resolves when the function completes.
     */
    async run(): Promise<void> {
        await this.installPackages()
        cleanup(this.tempDir)
    }
}
