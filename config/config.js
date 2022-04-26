const os = require("os");
const path = require("path");
const workDir = process.cwd();

exports.port = 10020;
// 配置文件
exports.ConfigFileName = "HBuilderConfig.json";
// 插件生成的临时文件
exports.ConfigFileTemp = path.join(
  workDir,
  "./.hbuilderx/HBuilderConfigTemp.json"
);
