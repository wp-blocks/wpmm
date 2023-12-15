import inquirer from 'inquirer'
import path from 'path'
import { DefaultWpInstallFolder, PkgFileName } from '../constants'
import { getWordPressPaths } from './wordpress'
import { Dump } from '../Dump'
import { WPMMconfig } from '../types'

/**
 * This function prompts the user for configuration details regarding a new WordPress installation.
 * It first checks if the user wants to create a new installation. If so, it asks for the name,
 * version, and language of the site. It then initializes the configuration based on the provided
 * details. If the user does not want a new installation, it terminates the process with an error
 * message asking for a template file.
 *
 * @return Returns a promise that resolves with the result of the initialization of the configuration or ends the process if the template file does not exist.
 */
export async function askForConfiguration(): Promise<{
    name: string
    version: string
    language: string
}> {
    return await inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'newInstallation',
                message:
                    '❓ Do you want to create a new WordPress installation?',
                default: true,
            },
            {
                type: 'input',
                name: 'name',
                message: 'Enter the name of your website:',
                default:
                    process.cwd().split('/').pop() || DefaultWpInstallFolder,
                when: (answers) => answers.newInstallation, // This question will be asked only if 'newInstallation' is true
            },
            {
                type: 'input',
                name: 'version',
                message: 'Enter the WordPress version:',
                default: 'Latest',
                when: (answers) => answers.newInstallation,
            },
            {
                type: 'input',
                name: 'language',
                message: 'Enter the language for your WordPress site:',
                default: 'English',
                when: (answers) => answers.newInstallation,
            },
        ])
        .then(
            (answers: {
                newInstallation: boolean
                name: string
                version: string
                language: string
            }) => {
                if (answers.newInstallation) {
                    /** @type {import("../constants").WordpressPkg} */
                    return {
                        name: answers?.name,
                        version: answers?.version,
                        language: answers?.language,
                    }
                } else {
                    console.error(
                        `⚠️ The template file ${PkgFileName} does not exist in the current folder. Please provide a template file using the --template option.`
                    )
                    process.exit(1)
                }
            }
        )
}

/**
 * This async function asks the user if they want to dump the WordPress
 * installation. If the user confirms, it gets the WordPress paths, creates
 * a new Dump instance, and initiates it.
 *
 * It does not take any parameters.
 *
 * @return The result of the dump initiation, if it is initiated.
 */
export async function askForDump(): Promise<WPMMconfig | undefined> {
    return await inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'dump',
                message: '❓ Do you want to Dump this WordPress installation?',
                default: true,
            },
        ])
        .then((answers) => {
            if (answers.dump) {
                const baseFolder = process.cwd()
                const paths = getWordPressPaths(
                    path.dirname(baseFolder),
                    baseFolder
                )
                const dump = new Dump(paths)
                return dump.init()
            }
        })
        .then((result) => {
            if (result?.wordpress.name) {
                return result
            }
        })
}
