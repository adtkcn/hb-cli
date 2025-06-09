const path = require("path");
const workDir = process.cwd();

exports.workDir = workDir;
exports.port = 10020;
// 配置文件
exports.ConfigFileName = path.join(workDir, "hb-cli.config.js");
exports.manifestFileName = path.join(workDir, "manifest.json");

// 插件生成的临时文件
exports.ConfigFileTemp = path.join(workDir, "./.hbuilderx/hb-cli.pack.json");
exports.IpFile = path.join(workDir, "./.hbuilderx/hb-cli.ip.json");

exports.genEnvConfigFile = path.join(workDir, "./HBuilderEnv.js");

// 用到的工具
exports.HBuilderAdb = path.join(
  process.env.HBuilder || "",
  "plugins/launcher/tools/adbs/adb"
);
exports.HBuilderCli =
  process.platform === "darwin"
    ? "/Applications/HBuilderX.app/Contents/MacOS/cli"
    : path.join(process.env.HBuilder || "", "cli");
