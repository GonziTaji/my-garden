/**
 * @see https://prettier.io/docs/configuration
 *
 * If using prettierd, remember to call `prettierd restart` for the daemon to
 * re-read the config file after changes
 *
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  semi: false,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
}

export default config
