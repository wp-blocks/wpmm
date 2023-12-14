import fs from 'fs'
import path from 'path'
import { parseWpConfig } from '../src/utils/parsers'


describe('parseWpConfig with real file', () => {
    it('should parse wp-config.php file content and return constants and variables', () => {
        const mockWpConfigContent = `
    define( 'DB_NAME', 'nome_del_database_qui' );
    $table_prefix = 'wp_';
    $table_prefix2 = "wp2_";
    // This should be ignored
    // define('IGNORE', 'ignore');
    // $ignore = 'a';
    `

        const result = parseWpConfig(mockWpConfigContent)

        expect(result).toEqual({
            DB_NAME: 'nome_del_database_qui',
            table_prefix: 'wp_',
            table_prefix2: 'wp2_',
        })
    })

    it('should parse wp-config.php file content and return constants and variables', () => {
        const filePath = path.join(__dirname, 'fixtures', 'wp-config.php')

        // Read the actual file content
        const wpConfigContent = fs.readFileSync(filePath, 'utf8')

        const result = parseWpConfig(wpConfigContent)

        // Ensure the result is as expected based on the actual file content
        expect(result).toBeTruthy()
        expect(result).toMatchObject({
            table_prefix: 'wp_'
        })
    })
})
