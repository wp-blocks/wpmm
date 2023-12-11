const fs = require('fs');
const https = require('node:https');
const extract = require('extract-zip');

/**
 * Create a temporary directory if it does not alreadyW exist.
 *
 * @param {fs.PathLike} dirpath - The path of the temporary directory.
 */
function makeDir (dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

/**
 * Asynchronously cleans up a temporary directory.
 *
 * @param {string} dir - The path to the temporary directory.
 *
 * @return {void} A promise that resolves when the cleanup is complete.
 */
function cleanup (dir) {
  try {
    fs.rmSync(dir, { recursive: true });
    console.log(`🧹 ${dir} removed successfully.`);
  } catch (/** @type {any} */ err) {
    // File deletion failed
    console.error(err.message);
  }
}

/**
 * Renames a folder from the old path to the new path.
 *
 * @param {string} oldPath - The path of the folder to be renamed.
 * @param {string} newPath - The new path of the folder.
 */
function renameFolder (oldPath, newPath) {
  fs.renameSync(oldPath, newPath);
}

/**
 * Downloads a file from the specified URL and saves it to the target file.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} targetFile - The file path where the downloaded file will be saved.
 * @return {Promise<void>} A promise that resolves when the file is successfully downloaded and saved, or rejects with an error if there was an issue.
 */
async function downloadFile (url, targetFile) {
  if (fs.existsSync(targetFile)) {
    console.log(`ℹ️ ${targetFile} already exists. Skipping download.`);
    return;
  }
  try {
    return await new Promise((resolve, reject) => {
      https.get(
        url,
        { headers: { 'User-Agent': 'nodejs' } },
        async (response) => {
          const code = response.statusCode ?? 0;

          if (code >= 400) {
            return reject(new Error(response.statusMessage));
          }

          if (code > 300 && code < 400 && !!response.headers.location) {
            return resolve(await downloadFile(response.headers.location, targetFile));
          }

          const fileWriter = fs.createWriteStream(targetFile).on('finish', () => {
            resolve(void 0);
          });

          response.pipe(fileWriter);
        }).on('error', (error) => {
        reject(error);
      });
    });
  } catch ( /** @type {any} error */ error) {
    throw new Error(error);
  }
}

/**
 * Extracts a zip file to a target directory.
 *
 * @param {string} zipFilePath - The path of the zip file to extract.
 * @param {string} targetDirectory - The directory to extract the zip file to.
 * @throws {Error} Throws an error if the extraction fails.
 *
 * @return {Promise<string>}  Returns the common root path of the extracted files.
 */
async function extractZip (zipFilePath, targetDirectory) {
  /** @type {string} commonRootPath - The common root path of the extracted files */
  let commonRootPath= "";

  await extract(zipFilePath, {
    dir: targetDirectory,
    onEntry: (entry) => {
      const entryPathParts = entry.fileName.split('/');

      if (!commonRootPath) {
        // Initialize the common root path with the first entry
        commonRootPath = entryPathParts[0];
      } else {
        // Update the common root path based on the current entry
        for (let i = 0; i < entryPathParts.length; i++) {
          if (commonRootPath.split('/')[i] !== entryPathParts[i]) {
            commonRootPath = commonRootPath.split('/').slice(0, i).join('/');
            break;
          }
        }
      }
      return commonRootPath;
    }
  }).then((result) => {
      // Return the root folder name
      console.log(`📂 Extracted to ${result}`);
      /** @type {string} result - The common root path of the extracted files */
      return result;
  }).catch((err) => {
      throw new Error(`📛 Error extracting ${zipFilePath} zip: ${err}`);
  });

  return commonRootPath;
}

module.exports = {
  makeDir,
  cleanup,
  renameFolder,
  downloadFile,
  extractZip
};
