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
 * @return {Promise<void>} A promise that resolves when the cleanup is complete.
 */
async function cleanup (dir) {
  return fs.rm(dir, { recursive: true }, (err) => {
    if (err) {
      // File deletion failed
      console.error(err.message)
      return
    }
    console.log(`📁 ${dir} removed successfully.`)
  })
}

function renameFolder (oldPath, newPath) {
  fs.renameSync(oldPath, newPath)
}

function getWordPressDownloadUrl (version, language) {
  if (language && !language.startsWith('en')) {
    return `https://${language}.wordpress.org/wordpress-${version}-${language}`
  } else {
    return `https://wordpress.org/wordpress-${version}`
  }
}

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
    console.log(`📛 Error extracting ${zipFilePath} zip: ${err}`)
    return err
  }
}

async function installNpmPackages (packageDirectory) {
  const packageJsonPath = path.join(packageDirectory, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Local directory (${packageDirectory}) does not contain a package.json file.`)
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
        console.log(`${packageName} dependencies installed and built.`)
        resolve()
      }
    })
  })
}

exports.makeDir = makeDir
exports.cleanup = cleanup
exports.renameFolder = renameFolder
exports.downloadFile = downloadFile
exports.getWordPressDownloadUrl = getWordPressDownloadUrl
exports.getDownloadUrl = getDownloadUrl
exports.extractZip = extractZip
exports.installNpmPackages = installNpmPackages
