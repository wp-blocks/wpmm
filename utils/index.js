const path = require("path");
const fs = require("fs");
const child_process = require("child_process");

function getWordPressDownloadUrl(version, language) {
  if (language && !language.startsWith('en')) {
    return `https://${language}.wordpress.org/wordpress-${version}-${language}.zip`;
  } else {
    return `https://wordpress.org/wordpress-${version}.zip`;
  }
}

function getDownloadUrl(packageName, type) {
  if (packageName.startsWith('http://') || packageName.startsWith('https://')) {
    return packageName;
  }
  return `https://downloads.wordpress.org/${type}/${packageName}`;
}

async function installNpmPackages(packageDirectory) {
  const packageJsonPath = path.join(packageDirectory, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    console.log(`Installing and building ${packageName} from local directory...`);
    await new Promise((resolve, reject) => {
      child_process.exec(`npm ci && npm build`, {cwd: packageDirectory}, (error) => {
        if (error) {
          reject(`Error installing package from local directory (${packageDirectory}): ${error.message}`);
        } else {
          resolve();
        }
      });
    });
  } else {
    console.error(`Local directory (${packageDirectory}) does not contain a package.json file.`);
  }
}

exports.getWordPressDownloadUrl = getWordPressDownloadUrl;
exports.getDownloadUrl = getDownloadUrl;
exports.installNpmPackages = installNpmPackages;
