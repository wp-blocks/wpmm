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

function getDownloadUrl(packageName, packageVersion, type) {
  if (packageVersion) {
    packageName = `${packageName}.${packageVersion}`;
  }
  // the absolute path to the package
  if (packageName.startsWith('http://') || packageName.startsWith('https://')) {
    return packageName;
  }
  // github author/repo
  if ( packageName.split('/').length === 2 ) {
    const [user, repo] = packageName.split('/');
      return `https://github.com/${user}/${repo}/archive/refs/${packageVersion ? 'tags/' + packageVersion : 'heads/master'}`;
  }
  // otherwise we assume it's a repo on wordpress.org
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
