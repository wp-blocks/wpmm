const path = require('path')
const fs = require('fs')
const { exec } = require('node:child_process')
const extract = require('extract-zip')
const https = require('node:https')

/**
 * Create a temporary directory if it does not already exist.
 */
function makeDir (dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true })
  }
}

/**
 * Asynchronously cleans up a temporary directory.
 *
 * @param {string} dir - The path to the temporary directory.
 * @return {void} A promise that resolves when the cleanup is complete.
 */
async function cleanup (dir) {
  try {
    fs.rmSync(dir, { recursive: true })
    console.log(`🧹 ${dir} removed successfully.`)
  } catch (err) {
    // File deletion failed
    console.error(err.message)
  }
}

/**
 * Renames a folder from the old path to the new path.
 *
 * @param {string} oldPath - The path of the folder to be renamed.
 * @param {string} newPath - The new path of the folder.
 */
function renameFolder (oldPath, newPath) {
  fs.renameSync(oldPath, newPath)
}

/**
 * Generates the download URL for a specific version of WordPress.
 *
 * @param {string} version - The version of WordPress.
 * @param {string} language - The language for the WordPress download. Defaults to 'en'.
 * @return {string} The download URL for the specified version of WordPress.
 */
function getWordPressDownloadUrl (version, language) {
  if (language && !language.startsWith('en')) {
    return `https://${language}.wordpress.org/wordpress-${version}-${language}`
  } else {
    return `https://wordpress.org/wordpress-${version}`
  }
}

/**
 * Generates a download URL for a given package.
 *
 * @param {string} packageName - The name of the package.
 * @param {string} packageVersion - The version of the package (optional).
 * @param {string} type - The type of the package (e.g., 'plugins', 'themes').
 * @return {string} The download URL for the package.
 */
function getDownloadUrl (packageName, packageVersion, type) {
  if (packageVersion) {
    packageName = `${packageName}.${packageVersion}`
  }

  // Using the absolute uri of the package
  if (packageName.startsWith('http://') || packageName.startsWith('https://')) {
    return packageName
  }

  // GitHub author/repo
  if (packageName.split('/').length === 2) {
    const [user, repo] = packageName.split('/')
    return `https://github.com/${user}/${repo}/archive/refs/${packageVersion ? 'tags/' + packageVersion : 'heads/master'}`
  }

  // otherwise we assume it's a repo on WordPress.org
  return `https://downloads.wordpress.org/${type}/${packageName}`
}

/**
 * Downloads a file from the specified URL and saves it to the target file.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} targetFile - The file path where the downloaded file will be saved.
 * @return {Promise<void>} A promise that resolves when the file is successfully downloaded and saved, or rejects with an error if there was an issue.
 */
async function downloadFile (url, targetFile) {
  try {
    return await new Promise((resolve, reject) => {
      https.get(
        url,
        { headers: { 'User-Agent': 'nodejs' } },
        async (response) => {
          const code = response.statusCode ?? 0

          if (code >= 400) {
            return reject(new Error(response.statusMessage))
          }

          if (code > 300 && code < 400 && !!response.headers.location) {
            return resolve(await downloadFile(response.headers.location, targetFile))
          }

          const fileWriter = fs.createWriteStream(targetFile).on('finish', () => {
            resolve({})
          })

          response.pipe(fileWriter)
        }).on('error', (error) => {
        reject(error)
      })
    })
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Extracts a zip file to a target directory.
 *
 * @param {string} zipFilePath - The path of the zip file to extract.
 * @param {string} targetDirectory - The directory to extract the zip file to.
 * @return {Promise<string>} Returns true if the extraction is successful, false otherwise.
 */
async function extractZip (zipFilePath, targetDirectory) {
  let commonRootPath // Variable to store the common root path

  try {
    await extract(zipFilePath, {
      dir: targetDirectory,
      onEntry: (entry) => {
        const entryPathParts = entry.fileName.split('/')

        if (!commonRootPath) {
          // Initialize the common root path with the first entry
          commonRootPath = entryPathParts[0]
        } else {
          // Update the common root path based on the current entry
          for (let i = 0; i < entryPathParts.length; i++) {
            if (commonRootPath.split('/')[i] !== entryPathParts[i]) {
              commonRootPath = commonRootPath.split('/').slice(0, i).join('/')
              break
            }
          }
        }
      }
    })

    // Return the root folder name
    console.log(`📂 Extracted to ${commonRootPath}`)
    return commonRootPath
  } catch (err) {
    console.error(`📛 Error extracting ${zipFilePath} zip: ${err}`)
    return err
  }
}

/**
 * Installs npm packages in the specified package directory.
 *
 * @param {string} packageDirectory - The directory path where the package is located.
 * @return {Promise<void>} - A promise that resolves when the packages are installed and built.
 */
async function installNpmPackages (packageDirectory) {
  const packageJsonPath = path.join(packageDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    // console.warn(`Local directory (${packageDirectory}) does not contain a package.json file.`)
    return
  }
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const packageName = packageData.name
  console.log(`🚀 Installing and building ${packageName} from local directory...`)

  const packageLockPath = path.join(packageDirectory, 'package-lock.json')
  let command = 'npm i && npm run build'
  if (fs.existsSync(packageLockPath)) {
    command = 'npm ci && npm run build'
  }

  await new Promise((resolve, reject) => {
    exec(command, { cwd: packageDirectory }, (error) => {
      if (error) {
        reject(error)
      } else {
        console.log(`📦 ${packageName} dependencies installed and built.`)
        resolve()
      }
    })
  })
}

/**
 * Define a function to find the value of a specific option in an array of arguments
 *
 * @param args An array of arguments
 * @param optionName The name of the option to search for
 * @return {*|null} The value of the option if found, null otherwise
 */
function getOptionValue (args, optionName) {
  const optionIndex = args.indexOf(optionName)
  return optionIndex !== -1 && optionIndex + 1 < args.length ? args[optionIndex + 1] : null
}

exports.makeDir = makeDir
exports.cleanup = cleanup
exports.renameFolder = renameFolder
exports.downloadFile = downloadFile
exports.getWordPressDownloadUrl = getWordPressDownloadUrl
exports.getDownloadUrl = getDownloadUrl
exports.extractZip = extractZip
exports.installNpmPackages = installNpmPackages
// argv
exports.getOptionValue = getOptionValue
