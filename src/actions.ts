import { getInfo } from './utils/data'
import { Initialize } from './Initialize'
import { Installer } from './Installer'
import { Updater } from './Updater'
import { Dump } from './Dump'
import { Database } from './Database'
import { WPMMconfig, WPMMpaths } from './types'
import { isValidUpdateOptions } from './utils/parsers'
import yargs from 'yargs'

/**
 * The actions object.
 *
 * @param {Object} props - The configuration object.
 * @param {WPMMconfig} props.config - The configuration object.
 * @param {WPMMpaths} props.paths - The paths object.
 *
 * @return {Object} The actions object.
 */
export function actions({
    config,
    paths,
}: {
    config: WPMMconfig
    paths: WPMMpaths
}): { invokeAction: (key: string, argv: yargs.Argv) => void } {
    /**
     * The actions object.
     */
    const wpmmActions: {
        [key: string]: ({
            config,
            paths,
            argv,
        }: {
            config?: WPMMconfig
            paths?: WPMMpaths
            argv?: yargs.Argv
        }) => unknown
    } = {
        /** Retrieve information using the provided configuration and actions. */
        info: () => getInfo(config, wpmmActions),

        /**
         * Initialize the WordPress installation.
         * @returns {Promise<void>}
         * */
        init: async (): Promise<void> => {
            const initializer = new Initialize()
            const result = await initializer.generateConfig()
            initializer.writeConfig(result)
        },

        /** Install WordPress */
        install: () => {
            const installer = new Installer(config, paths)

            installer.run().then(() => {
                console.log('🚀 WordPress installed successfully.')
            })
        },

        /**
         * Update WordPress packages
         *
         * @param argv - The arguments object.
         */
        update: ({ argv }) => {
            if (argv && isValidUpdateOptions(argv)) {
                const updater = new Updater(config)
                updater
                    .run(argv)
                    .then(() => {
                        console.log('🚀 WordPress updated successfully.')
                    })
                    .catch(() => {
                        console.log('🔴 WordPress update failed.')
                    })
            } else {
                console.log(
                    'you must specify either all, plugins, themes, or wordpress'
                )
                console.log('ie. wpmm --update all')
            }
        },

        /** Dumps the current WordPress installation data. This function creates a new Dump instance and initializes it.*/
        dump: () => {
            const dump = new Dump(paths)
            dump.init().then(() => {
                console.log('🚀 All data dumped successfully.')
            })
        },

        /** Dump the current WordPress database. */
        'dump-db': async () => {
            const db = new Database(config)
            await db.dumpDatabase(paths.baseFolder)
            console.log(`🚀 Database dumped successfully.`)
        },

        /** Dump the current WordPress database, plugins and themes setup. */
        'dump-all': () => {
            wpmmActions['dump-db']({}) &&
                wpmmActions.dump({}) &&
                console.log('🚀 All data dumped successfully.')
        },

        /** Upload a database by executing SQL queries from a specified file. */
        'upload-db': () => {
            const db = new Database(config)
            db.uploadDatabase(config.wordpress.WP_config.DB_NAME).then(() => {
                console.log('🚀 Database uploaded successfully.')
            })
        },
    }

    return {
        /**
         * Invokes an action based on the given key and arguments.
         *
         * @param key - The key representing the action to be invoked.
         * @param argv - An array of arguments to be passed to the invoked action.
         */
        invokeAction: (key: string, argv: yargs.Argv) => {
            if (typeof wpmmActions[key] === 'function') {
                wpmmActions[key]({ config, paths, argv })
            } else {
                console.warn(`Invalid action: ${key}`)
            }
        },
    }
}
