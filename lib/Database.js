const mysql = require('mysql2/promise');
const mysqldump = require('mysqldump');
const {getConnectionSettings} = require("./utils/data");
const path = require("path");
const fs = require('fs');

/**
 * Constructor for the Database class.
 *
 * @class Database
 * @param {WPMMconfig} config - The configuration object.
 */
class Database {
  /**
   * A description of the entire function.
   *
   * @param {WPMMconfig} config - The configuration object.
   */
  constructor (config) {
    // Load configuration from wp-package.json
    this.config = config;
  }

  dbDumpFilename = () => {
    const date = new Date().toDateString().replace(" ", "-");
    if (! this.config.wordpress?.config?.DB_NAME) {
      console.log('🚀 No database name provided. Skipping database dump.', this.config.wordpress);
      return;
    }
    return `${this.config.wordpress.config.DB_NAME}-${date}.sql.gz`;
  };

  /**
   * Uploads a database by executing SQL queries from a specified file.
   *
   * @async
   * @param {string} sqlFilePath - The path to the SQL file.
   * @return {Promise<Connection | Error>} - A Promise that resolves to a MySQL Connection object or throws an Error.
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

      const databaseConnectionConfig = getConnectionSettings(this.config);

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
    } catch (error) {
      console.error('🔴 Error uploading database:', error.message);
    }
  }

  /**
   * Asynchronously dumps the database to the specified output file.
   *
   * @param basePath - The base path of the WordPress installation.
   *
   * @return {Promise} - A promise that resolves if the database is dumped successfully, or rejects with an error message if an error occurs.
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

    if (!this.config.wordpress.config) {
      return new Error('🔴 Database configuration not found');
    }

    const databaseConnectionConfig = getConnectionSettings(this.config.wordpress.config);

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
