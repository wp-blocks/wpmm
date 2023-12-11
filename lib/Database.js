const mysql = require('mysql2/promise');
const mysqldump = require('mysqldump').default;
const {getConnectionSettings} = require("./utils/data");
const path = require("path");
const fs = require('fs');

/**
 * Constructor for the Database class.
 *
 * @class Database
 */
class Database {
  /**
   * A description of the entire function.
   *
   * @param {import('./constants').WPMMconfig} config - The configuration object.
   */
  constructor (config) {
    // Load configuration from wp-package.json
    this.config = config;
  }

  /**
   * Generates a unique filename for the database dump.
   *
   * @returns {string} - The generated filename.
   */
  dbDumpFilename = () => {
    const date = new Date().toDateString().replace(" ", "-");
    return `${this.config.wordpress.WP_config.DB_NAME}-${date}.sql.gz`;
  };

  /**
   * Uploads a database by executing SQL queries from a specified file.
   *
   * @async
   * @param {string} sqlFilePath - The path to the SQL file.
   * @return {Promise<void | Error>} - A Promise that resolves to a MySQL Connection object or throws an Error.
   */
  async uploadDatabase (sqlFilePath) {
    try {
      console.log('Uploading database...');

      if (!fs.existsSync(sqlFilePath)) {
        return new Error('SQL file not found');
      }

      if (!this.config) {
        return new Error('Database configuration not found');
      }

      /**
       * the connection settings for the database
       * @type {mysql.ConnectionOptions} databaseConnectionConfig - The connection settings for the database.
       */
      const databaseConnectionConfig = getConnectionSettings(this.config.wordpress.WP_config);

      /**
       * @type {import('mysql2/promise').Connection} connection - The MySQL connection object.
       */
      const connection = await mysql.createConnection(databaseConnectionConfig);

      const sqlFileContent = fs.readFileSync(sqlFilePath, 'utf8');
      const queries = sqlFileContent.split(';');

      for (const query of queries) {
        if (query.trim() !== '') {
          await connection.query(query);
        }
      }

      console.log('Database uploaded successfully');
      connection.end().then(() => {
        console.log('👍 Database connection closed');
      }).catch(error => {
        console.error('🫠 Error closing database connection:', error.message);
      });
    } catch (/** @type {any} */ error) {
      console.error('🔴 Error uploading database:', error.message);
    }
  }

  /**
   * Asynchronously dumps the database to the specified output file.
   *
   * @param {string} basePath - The base path of the WordPress installation.
   * @async
   * @return {Promise<void | Error>} - A promise that resolves if the database is dumped successfully, or rejects with an error message if an error occurs.
   */
  async dumpDatabase (basePath) {
    const dumpPath = path.join( basePath, 'backups', 'db');
    const dumpFile = path.join( dumpPath, this.dbDumpFilename());

    // Check if the directory exists and create it if it doesn't
    if (!fs.existsSync(dumpPath)) {
      fs.mkdirSync( dumpPath, { recursive: true });
      console.log(`ℹ️ Directory created: ${dumpPath}`);
    }

    console.log(`✳️ Dumping database to ${dumpFile}...`);

    if (!this.config.wordpress.WP_config) {
      return new Error('🔴 Database configuration not found');
    }

    /**
     * the connection settings for the database
     *
     * @type {mysqldump.ConnectionOptions} databaseConnectionConfig - The connection settings for the database.
     */
    const databaseConnectionConfig = getConnectionSettings(this.config.wordpress.WP_config);

    if (databaseConnectionConfig.host === 'localhost') {
      console.log('⚠️ Warning: You are using localhost as your database host. This may not work correctly.');
    }

    mysqldump({
      connection: databaseConnectionConfig,
      dumpToFile: dumpFile,
      compressFile: true
    }).catch(error => {
      console.error('🔴 Error dumping database:', error.message);
    });
  }
}

module.exports = Database;
