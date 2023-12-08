const mysql = require('mysql2/promise');
const { getConnectionSettings } = require('./utils');
const mysqldump = require('mysqldump');
const fs = require('fs').promises;

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

      const sqlFileContent = await fs.readFile(sqlFilePath, 'utf8');
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
   * @param {string} outputFilePath - The path of the file to dump the database to.
   * @return {Promise} - A promise that resolves if the database is dumped successfully, or rejects with an error message if an error occurs.
   */
  async dumpDatabase (outputFilePath) {
    try {
      console.log('Dumping database...');

      if (!this.config) {
        return new Error('Database configuration not found');
      }

      const databaseConnectionConfig = getConnectionSettings(this.config);

      await mysqldump({
        databaseConnectionConfig,
        dumpToFile: outputFilePath,
        compressFile: true
      });

      console.log('🚀 Database dumped successfully');
    } catch (error) {
      console.error(' 🔴 Error dumping database:', error.message);
    }
  }
}

module.exports = Database;
