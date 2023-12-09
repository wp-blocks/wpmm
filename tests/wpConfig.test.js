const fs = require("fs");
const path = require("path");
const {parseWpConfig} = require("../lib/utils/wordpress");

jest.mock("fs");
jest.mock("path");


describe("parseWpConfig tests", () => {

  test("if wp-config.php valid, should return object containing extracted constants and variables", () => {
    const mockWpConfigContent = `
    define( 'DB_NAME', 'nome_del_database_qui' );
    $table_prefix = 'wp_';
    $table_prefix2 = "wp2_";
    // This should be ignored
    // define('IGNORE', 'ignore');
    // $ignore = 'a';
    `;

    path.join.mockReturnValue('./assets/wp-config.php');
    fs.readFileSync.mockImplementation(() => mockWpConfigContent);

    const result = parseWpConfig("dummy-path");

    console.log(result);

    expect(result).toEqual({
      constants: { "DB_NAME": "nome_del_database_qui" },
      variables: { "table_prefix": "wp_", "table_prefix2": "wp2_" }
    });
  });
});
