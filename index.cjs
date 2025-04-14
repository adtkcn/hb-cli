var { deepAssign } = require("./utils/merge");
/**
 * @typedef {import('./index')} AppConfig
 */
/**
 * @param {AppConfig} info
 * @returns {AppConfig}
 */
function defineConfig(info) {
  return info;
}
exports.defineConfig = defineConfig;
exports.deepAssign = deepAssign;
