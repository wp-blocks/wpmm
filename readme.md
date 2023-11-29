# WordPress Installer

WordPress Installer is a Node.js script that simplifies the process of installing WordPress, themes, and plugins. It allows you to define the configuration in a `wordpress-package.json` file, specifying the WordPress version, language, themes, and plugins to be installed.

## Usage

1. Clone the repository or install the npm package.
2. Create a `wordpress-package.json` file with your desired configuration.
3. Run the script using `npm start` or `node index.js`.

## Configuration

Edit the `wordpress-package.json` file to define the WordPress version, language, themes, and plugins to be installed.

### Example Configuration

```json
{
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
      "name": "wordpress-seo"
    },
    {
      "name": "https://github.com/erikyo/OH-MY-SVG"
    }
  ]
}
```
