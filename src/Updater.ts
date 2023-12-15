import { exec } from 'node:child_process'
import { UpdateObject, WPMMconfig } from './types'

/**
 * Represents the Updater class.
 *
 * @class Updater
 */
export class Updater {
    /** THe configuration object. */
    config: WPMMconfig

    /**
     * Constructs a new instance of the class.
     *
     * @param {WPMMconfig} config - the configuration object
     */
    constructor(config: WPMMconfig) {
        // Load configuration from wp-package.json
        this.config = config
    }

    /**
     * Update plugins.
     *
     * @async
     * @function updatePlugins - Updates plugins using the `wp plugin install` command.
     * @throws {Error} If there is an error updating the plugins.
     */
    async updatePlugins(): Promise<void> {
        try {
            const plugins = this.config.plugins

            if (!plugins || !Array.isArray(plugins)) {
                return console.error('Invalid or missing plugins configuration')
            }

            for (const plugin of plugins) {
                const command = `wp plugin install ${plugin} --activate`

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(
                            `Error updating plugin ${plugin}:`,
                            error.message,
                            stderr,
                            stdout
                        )
                    } else {
                        console.log(`Plugin ${plugin} updated successfully`)
                    }
                })
            }
        } catch (error: unknown) {
            throw new Error(
                `Error updating plugins: ${(error as Error).message}`
            )
        }
    }

    /**
     * Updates the themes in the configuration by installing and activating them.
     *
     * @async
     * @return updateThemes - Updates themes using the `wp theme install` command.
     */
    async updateThemes(): Promise<void> {
        try {
            const themes = this.config.themes

            if (!themes || !Array.isArray(themes)) {
                console.error('Invalid or missing themes configuration')
                return
            }

            for (const theme of themes) {
                const command = `wp theme install ${theme} --activate`

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(
                            `Error updating theme ${theme}:`,
                            error.message,
                            stderr,
                            stdout
                        )
                    } else {
                        console.log(`Theme ${theme} updated successfully`)
                    }
                })
            }
        } catch (error: unknown) {
            throw new Error(
                `Error updating Themes: ${(error as Error).message}`
            )
        }
    }

    /**
     * Updates the WordPress installation.
     *
     * @return {Promise<void>} A promise that resolves when the update is complete.
     */
    async updateWordPress() {
        try {
            const command = 'wp core update'

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        'Error updating WordPress:',
                        error.message,
                        stderr,
                        stdout
                    )
                } else {
                    console.log('WordPress updated successfully')
                }
            })
        } catch (error: unknown) {
            throw new Error(
                `Error updating Wordpress: ${(error as Error).message}`
            )
        }
    }

    /**
     * A description of the entire function.
     *
     * @param argv - An object containing the update options.
     *                       It should have the following properties:
     *                       - updateWordPress: boolean
     *                       - updateAll: boolean
     *                       - updateThemes: boolean
     *                       - updatePlugins: boolean
     * @return A promise that resolves when the function completes.
     */
    async run(argv: UpdateObject): Promise<void> {
        /**
         * An object containing the update options.
         */

        const updateObject = {
            updateAll: argv.plugins,
            updatePlugins: argv.plugins,
            updateThemes: argv.themes,
            updateWordPress: argv.wordpress,
        }

        if (updateObject.updateAll) {
            await this.updateWordPress()
            await this.updatePlugins()
            await this.updateThemes()
        } else {
            if (updateObject.updatePlugins) {
                await this.updatePlugins()
            }

            if (updateObject.updateThemes) {
                await this.updateThemes()
            }

            if (updateObject.updateWordPress) {
                await this.updateWordPress()
            }
        }
    }
}
