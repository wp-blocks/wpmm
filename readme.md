# WordPress Magic Manager 🪄
<div>
  <a href="https://www.npmjs.com/package/wpmm">
    <img alt="version" src="https://img.shields.io/npm/v/wpmm.svg?label=npm%20version" />
  </a>
  <a href="https://github.com/erikyo/wpmm/blob/master/LICENSE">
    <img alt="version" src="https://img.shields.io/npm/l/wpmm" />
  </a>
  <a href="https://github.com/erikyo/wpmm/actions">
    <img alt="build" src="https://img.shields.io/github/actions/workflow/status/erikyo/wpmm/node.js.yml" />
  </a>
  <a href="https://github.com/erikyo/wpmm/actions">
    <img alt="workflows" src="https://github.com/erikyo/wpmm/actions/workflows/node.js.yml/badge.svg" />
  </a>
</div>

WordPress Installer is a Node.js script designed to streamline the installation process of WordPress, themes, and plugins. It simplifies the configuration through a wp-package.json file, allowing you to specify the WordPress version, language, themes, and plugins for installation.

## Usage

1. Create a `wp-package.json` file with your desired configuration. You can use the command `npx wpmm --init` to create an empty configuration file or `npx wpmm --dump` in the root directory of a wordpress website in order to get the configuration of that website.
2. Run the script using `npx wpmm`.

## Commands and Options
### `npx wpmm`
Installs the WordPress version, themes, and plugins defined in wp-package.json
Whenever the configuration file is not found, the command will install the last WordPress version.

### `npx wpmm --version`
### `npx wpmm --v`
output the current wpmm version

### `npx wpmm --info`
Returns the information for the Wordpress installation in the current folder

### `npx wpmm --init`
Initialize the project and create a sample wp-package.json file.

### `npx wpmm --upload-database database/my.sql`
Upload a database named my.sql into the wordpress database

### `npx wpmm --dump-database`
Download the current wp database and save it into /backups/${databasename}.sql.gz

### `npx wpmm --dump`
Scan and extract version information from PHP files within themes and plugins.

## Configuration

Edit the `wp-package.json` file to define the WordPress version, language, themes, and plugins to be installed.

### Example Configuration

```json
{
  "name": "my-blog",
  "wordpress": {
    "version": "6.4.1",
    "language": "en_US",
    "config": {
      "DB_NAME": "your_database_name",
      "DB_USER": "your_database_user",
      "DB_PASSWORD": "your_database_password",
      "DB_HOST": "localhost",
      "DB_CHARSET": "utf8",
      "DB_COLLATE": "",
      "table_prefix": "wp_",
      "WP_DEBUG": true,
      "WP_SITEURL": "http://example.com",
      "WP_HOME": "http://example.com",
      "WP_CONTENT_DIR": "/path/to/custom/content",
      "WP_CONTENT_URL": "http://example.com/custom/content",
      "DISALLOW_FILE_EDIT": true
    }
  },
  "themes": [
    {
      "name": "modul-r",
      "version": "1.4.4",
      "source": "https://github.com/wp-blocks/modul-r.git"
    }
  ],
  "plugins": [
    {
      "name": "contact-form-7",
      "version": "5.8.3"
    },
    {
      "name": "cf7-antispam",
      "version": "0.4.5",
      "source": "https://github.com/wp-blocks/cf7-antispam/archive/refs/heads/main.zip"
    }
  ],
  "postInstall": [
    "wp cache flush",
    "wp plugin install $(wp plugin list --field=name) --force"
  ]
}

```

## Features
- WordPress Installation: Easily install a specific version of WordPress with configurable settings.
- Theme Installation: Specify themes and their versions to be installed.
- Plugin Installation: Install plugins directly from GitHub or other sources.
- Version Detection: Automatically extract version information from PHP files within themes and plugins.

## Contributions
Feel free to contribute by opening issues, suggesting features, or submitting pull requests. Your feedback is valuable!
