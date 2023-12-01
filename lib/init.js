const fs = require('fs');
const path = require('path');

class init {
  constructor (installer) {
    this.installer = installer;
    this.themeFolder = installer.themeFolder;
    this.pluginsFolder = installer.pluginsFolder;
  }

  init () {
    const themes = this.scanDirectory(this.themeFolder);
    const plugins = this.scanDirectory(this.pluginsFolder);

    const result = {
      name: this.installer.config.name,
      wordpress: this.installer.config.wordpress,
      themes,
      plugins,
      postInstall: []
    };

    const outputPath = path.join(process.cwd(), 'wp-config.json');

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 Initialization completed. Configuration saved to ${outputPath}`);
  }

  scanDirectory (directory) {
    const items = fs.readdirSync(directory);
    const result = [];

    for (const item of items) {
      const fullPath = path.join(directory, item);

      if (fs.statSync(fullPath).isDirectory()) {
        const stylePath = path.join(fullPath, 'style.css');
        if (fs.existsSync(stylePath)) {
          const version = this.extractVersionFromStyleFile(stylePath);
          result.push({ name: item, version });
        }
      } else if (item.endsWith('.php')) {
        const version = this.extractVersionFromPHPFile(fullPath);
        result.push({ name: item, version });
      }
    }

    return result;
  }

  extractVersionFromStyleFile (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = /Version:\s*([\d.]+)/i.exec(content);
    return match ? match[1] : null;
  }

  extractVersionFromPHPFile (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = /Version:\s*([\d.]+)/i.exec(content);
    return match ? match[1] : null;
  }
}

module.exports = init;
