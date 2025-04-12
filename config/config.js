const path = require("path");
const workDir = process.cwd();

console.log("工作路径：", workDir);

exports.workDir = workDir;
exports.port = 10020;
// 配置文件
exports.ConfigFileName = path.join(workDir, "hb-cli.config.js");
exports.manifestFileName = path.join(workDir, "manifest.json");

// 插件生成的临时文件
exports.ConfigFileTemp = path.join(workDir, "./.hbuilderx/hb-cli.pack.json");
exports.IpFile = path.join(workDir, "./.hbuilderx/hb-cli.ip.json");

exports.genEnvConfigFile = path.join(workDir, "./HBuilderEnv.js");

exports.HBuilderAdb = path.join(
  process.env.HBuilder || "",
  "plugins/launcher/tools/adbs/adb"
);
exports.HBuilderCli = path.join(process.env.HBuilder || "", "cli");
