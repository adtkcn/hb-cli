const utils = require("./utils.js");
const config = require("../config/config.js");

function gencode(jsonObj) {
  return `
/**
 * 不要修改这个文件，再次执行hb-cli时会被覆盖
 * 
 * 你需要手动引入此文件
 * 
 * 你可以在 任意文件 引入此文件，例如在main.js上挂在到vue原型上，或者uni对象上，这样所有页面都可以用
 * 
 * 此文件由 hb-cli 命令工具生成
 */ 

export const HBuilderEnv=${JSON.stringify(jsonObj, undefined, "\t")}
export default HBuilderEnv;
    `;
}
async function generateCode(obj) {
  console.log("生成文件：", config.genEnvConfigFile);
  await utils.WriteConfig(config.genEnvConfigFile, gencode(obj));
}
module.exports = {
  generateCode,
};
