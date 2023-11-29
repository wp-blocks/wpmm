const path = require('path')
const fs = require('fs')
const { exec } = require('node:child_process')

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

async function installNpmPackages (packageDirectory) {
  const packageJsonPath = path.join(packageDirectory, 'package.json')
  const packageName = packageJsonPath.name

  if (fs.existsSync(packageJsonPath)) {
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
  } else {
    console.error(`Local directory (${packageDirectory}) does not contain a package.json file.`)
  }
}

exports.getWordPressDownloadUrl = getWordPressDownloadUrl
exports.getDownloadUrl = getDownloadUrl
exports.installNpmPackages = installNpmPackages
