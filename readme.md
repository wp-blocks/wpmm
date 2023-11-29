# WordPress Installer

WordPress Installer is a Node.js script designed to streamline the installation process of WordPress, themes, and plugins. It simplifies the configuration through a wp-package.json file, allowing you to specify the WordPress version, language, themes, and plugins for installation.

## Usage

1. Clone the repository or install the npm package.
2. Create a `wp-package.json` file with your desired configuration.
3. Run the script using `npm start`.

## Configuration

Edit the `wp-package.json` file to define the WordPress version, language, themes, and plugins to be installed.

### Example Configuration

```json
{
  "name": "modul-r-blog",
  "wordpress": {
    "version": "5.8.1",
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
      "version": "1.4.4"
    }
  ],
  "plugins": [
    {
      "name": "contact-form-7",
      "version": "5.8.3"
    },
    {
      "name": "cf7-antispam"
    },
    {
      "name": "wordpress-seo"
    },
    {
      "name": "erikyo/OH-MY-SVG"
    },
    {
      "name": "wp-super-cache"
    },
    {
      "name": "woocommerce"
    }
  ]
}

```
## Features
- WordPress Installation: Easily install a specific version of WordPress with configurable settings.
- Theme Installation: Specify themes and their versions to be installed.
- Plugin Installation: Install plugins directly from GitHub or other sources.

## Contributions
Feel free to contribute by opening issues, suggesting features, or submitting pull requests. Your feedback is valuable!
