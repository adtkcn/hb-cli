const path = require("path");
const os = require("os");
const fs = require("fs");
const cp = require("child_process");
const JSON5 = require("json5");
var iconv = require("iconv-lite");

const config = require("../config/config.js");

var workDir = process.cwd();

/**
 * 打开wifi调试
 */
function OpenWifiDebug() {
  return new Promise((resolve, reject) => {
    try {
      var ls = cp.spawn(config.HBuilderAdb, ["tcpip", "5555"], {});
      ls.on("exit", function (code) {
        if (code === 0) {
          console.log("OpenWifiDebug 成功");
          // 等待时间
          setTimeout(() => {
            resolve(0);
          }, 2000);
        } else {
          console.log("OpenWifiDebug 失败" + code);
          reject(code);
        }
      });
    } catch (error) {
      console.log("OpenWifiDebug 状态", error);
      reject(1);
    }
  });
}
/**
 * 连接到wifi
 * @param {string} ip
 * @returns
 */
function ConnectPhoneWithWifi(ip) {
  return new Promise((resolve, reject) => {
    try {
      var ls = cp.spawn(config.HBuilderAdb, ["connect", ip], {});
      ls.on("exit", function (code) {
        if (code === 0) {
          console.log("ConnectPhoneWithWifi 完成不一定成功", code);
          // 等待时间
          setTimeout(() => {
            resolve(0);
          }, 2000);
        } else {
          console.log("ConnectPhoneWithWifi 失败", code);
          reject(code);
        }
      });
    } catch (error) {
      console.log("ConnectPhoneWithWifi 异常", error);
      reject(1);
    }
  });
}

/**
 * 打开HBuilder编辑器
 * @returns {Promise<Number>} 状态码：0成功
 */
function OpenHBuilder() {
  return new Promise((resolve, reject) => {
    try {
      var ls = cp.spawn(config.HBuilderCli, ["open"], {});
      ls.on("exit", function (code) {
        if (code === 0) {
          console.log("打开编辑器 状态： 成功" + code);
          // 给hbuilder加载时间
          setTimeout(() => {
            resolve(0);
          }, 4000);
        } else {
          console.log("打开编辑器 状态： 失败" + code);
          reject(code);
        }
      });
    } catch (error) {
      console.log("打开编辑器 错误", error);
      reject(1);
    }
  });
}

/**
 * 获取本机ip
 *
 * @return {string} 局域网ip地址
 */
function getLocalIP() {
  const osType = os.type(); //系统类型
  const netInfo = os.networkInterfaces(); //网络信息
  let ip = "";

  // console.log(osType, netInfo);

  if (osType === "Windows_NT") {
    for (let dev in netInfo) {
      // console.log(dev);
      //win7的网络信息中显示为本地连接，win10显示为以太网
      if (dev === "本地连接" || dev === "以太网" || dev == "WLAN") {
        for (let j = 0; j < netInfo[dev].length; j++) {
          if (netInfo[dev][j].family === "IPv4") {
            ip = netInfo[dev][j].address;
            break;
          }
        }
      }
    }
  } else if (osType === "Linux") {
    ip = netInfo.eth0[0].address;
  }

  return ip;
}

/**
 *打开默认浏览器
 * @param {string} url
 */
function openDefaultBrowser(url) {
  console.log("预览地址：", url);
  console.log("使用 ctrl+c 关闭终端");

  switch (process.platform) {
    case "darwin":
      cp.exec("open " + url);
      break;
    case "win32":
      cp.exec("start " + url);
      break;
    default:
      cp.exec("xdg-open", [url]);
  }
}

/**
 * 读取工作目录配置文件
 * @param {string} FileName
 * @returns {Promise<object>}
 */
function readConfig(FileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(FileName, function (err, data) {
      if (err) {
        reject("读取配置文件错误,检查是否存在" + FileName);
        return;
      }
      var d = String(data);
      try {
        var c = JSON5.parse(d);
        resolve(c);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}
/**
 * 更改配置文件
 * @param {string} ConfigFilePath
 * @param {string} Config
 * @returns {Promise<string>}
 */
function WriteConfig(ConfigFilePath, Config = "") {
  return new Promise((resolve, reject) => {
    fs.mkdir(
      path.dirname(ConfigFilePath),
      {
        recursive: true,
      },
      function (err) {
        if (err) {
          console.log(err);
          return reject(err);
        }
        fs.writeFileSync(ConfigFilePath, Config);
        resolve(ConfigFilePath);
      }
    );
  });
}

// 合并HBuilderConfig配置文件
function MergeHBuilderConfig(HBuilderConfig = {}, info = {}) {
  HBuilderConfig.android = Object.assign({}, HBuilderConfig.android, {
    certfile: HBuilderConfig.android.certfile
      ? path.join(workDir, HBuilderConfig.android.certfile)
      : "",
  });
  HBuilderConfig.ios = Object.assign({}, HBuilderConfig.ios, {
    profile: HBuilderConfig.ios.profile
      ? path.join(workDir, HBuilderConfig.ios.profile)
      : "",
    certfile: HBuilderConfig.ios.certfile
      ? path.join(workDir, HBuilderConfig.ios.certfile)
      : "",
  });

  var newConfig = Object.assign({}, HBuilderConfig, info);
  var str = JSON.stringify(newConfig, undefined, "\t");
  return str;
}
function MergeManifestConfig(ManifestConfig = {}, info = {}) {
  var newConfig = Object.assign({}, ManifestConfig, info);
  var str = JSON.stringify(newConfig, undefined, "\t");
  return str;
}

/**
 * 运行cli
 * @param {Array} cli
 * @param {Function} callback
 */
function RunCli(cli, callback) {
  console.log(config.HBuilderCli, cli.join(" "));

  // var pack = cp.spawn(config.HBuilderCli, [
  //   "pack",
  //   "--config",
  //   HBuilderConfigFileTemp,
  // ]);
  var pack = cp.spawn(config.HBuilderCli, cli);

  pack.stdout.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-2, str);
  });

  pack.stderr.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-3, str);
  });

  pack.on("exit", function (code) {
    callback && callback(code);
  });
}

/**
 * 导出wgt包
 * @param {object} HBuilderConfig
 * @returns {Promise<Array>}
 */
function buildWgtCli(HBuilderConfig) {
  return new Promise((resolve, reject) => {
    var apps = [];
    RunCli(
      [
        "publish",
        "--platform",
        "APP",
        "--type",
        "wgt",
        "--project",
        HBuilderConfig.project,
        "--name",
        `${HBuilderConfig.project}.wgt`,
      ],
      function (code, data) {
        if (code == 0) {
          resolve(apps);
        } else if (code == -1 && data) {
          //自定义异常
          console.log(data);
          reject(-1, data);
        } else if (code == -2 && data) {
          //进程正常返回数据
          console.log(data);

          if (data.indexOf(`导出成功，路径为：`) != -1) {
            var appPath = data.split("导出成功，路径为：")[1];

            if (!appPath) {
              reject("打包的路径获取出错");
              return;
            }
            apps.push(appPath);
          }
        } else if (code == -3 && data) {
          //进程异常返回数据
          console.log(data); // 追加一行
          reject(data);
        }
      }
    );
  });
}
/**
 * 导出appResource
 * @param {object} HBuilderConfig
 * @returns {Promise<Array>}
 */
function buildAppResourceCli(HBuilderConfig) {
  return new Promise((resolve, reject) => {
    var apps = [];
    RunCli(
      [
        "publish",
        "--platform",
        "APP",
        "--type",
        "appResource",
        "--project",
        HBuilderConfig.project,
      ],
      function (code, data) {
        if (code == 0) {
          resolve(apps);
        } else if (code == -1 && data) {
          //自定义异常
          console.log(data);
          reject(-1, data);
        } else if (code == -2 && data) {
          //进程正常返回数据
          console.log(data);

          if (data.indexOf(`导出成功，路径为：`) != -1) {
            var appPath = data.split("导出成功，路径为：")[1];

            if (!appPath) {
              reject("打包的路径获取出错");
              return;
            }
            apps.push(appPath);
          }
        } else if (code == -3 && data) {
          //进程异常返回数据
          console.log(data); // 追加一行
          reject(data);
        }
      }
    );
  });
}

function GetUrl(str) {
  const reg =
    /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
  const strValue = str.match(reg);
  if (strValue && strValue.length > 0) {
    return strValue[0];
  }
  return null;
}

/**
 *
 * @param {boolean} isCustom 是不是自定义基座
 * @returns
 */

function buildApp(isCustom) {
  return new Promise(async (resolve, reject) => {
    try {
      var OpenHBuilderCode = await OpenHBuilder();
      if (OpenHBuilderCode !== 0) {
        reject("打开HBuilder编辑器失败");
        return;
      }
      var apps = [];
      RunCli(
        ["pack", "--config", config.ConfigFileTemp],
        function (code, data) {
          // code==-1 自定义错误code,-2是正常数据,-3是错误数据, 其他是进程code
          if (code == 0) {
            if (isCustom === false) {
              if (apps.length) {
                console.log("安装包", apps);
              } else {
                console.log("未获取到安装包");
              }
            }

            resolve(apps);
          } else if (code == -1 && data) {
            //自定义异常
            console.log(data);
            reject(-1, data);
          } else if (code == -2 && data) {
            //进程正常返回数据
            console.log(data);

            if (
              data.indexOf("打包成功") != -1 &&
              data.indexOf("安装包位置：") != -1
            ) {
              // 打包成功    安装包位置：E:/xiangheng/通知订阅/消息订阅/unpackage/release/apk/__UNI__ECA51B4__20220426171608.apk
              var appPath = data.split("安装包位置：")[1];
              appPath = appPath.split(" ")[0];
              if (!appPath) {
                reject("打包的路径获取出错");
                return;
              }
              var newAppPath = appPath
                .replace(/\//g, "\\")
                .replace(/\n/g, "")
                .replace(/(\s*$)/g, "");

              apps.push(newAppPath);
            }
            if (data.indexOf("iOS Appstore 下载地址:") != -1) {
              // ios下载地址
              var appUrl = GetUrl(data);
              if (appUrl) {
                // 下载文件
                apps.push(appUrl);
              }
            }
          } else if (code == -3 && data) {
            //进程异常返回数据
            console.log(data); // 追加一行
            reject(data);
          }
        }
      );
    } catch (error) {
      console.log("error", error);
      reject(error);
    }
  });
}

// nodejs封装方法打开指定目录，兼容win,mac,linux
function openDirectory(filePath) {
  const platform = process.platform;

    // 获取文件的父目录
    const parentDirectory = path.dirname(path.resolve(filePath));

  // 根据操作系统选择合适的命令
  let command;
  switch (platform) {
    case 'win32': // Windows
      command = `start ${parentDirectory}`;
      break;
    case 'darwin': // macOS
      command = `open ${parentDirectory}`;
      break;
    case 'linux': // Linux
      command = `xdg-open ${parentDirectory}`;
      break;
    default:
      console.error('Unsupported platform:', platform);
      return;
  }

  // 使用child_process执行命令
  cp.exec(command, (error) => {
    if (error) {
      console.error(`Error opening directory: ${error}`);
      return;
    }
    console.log(`Directory opened successfully.`);
  });
}
module.exports = {
  openDefaultBrowser,
  getLocalIP,
  readConfig,
  MergeHBuilderConfig,
  MergeManifestConfig,
  WriteConfig,
  buildApp,
  buildWgtCli,
  buildAppResourceCli,
  OpenHBuilder,
  OpenWifiDebug,
  ConnectPhoneWithWifi,
  GetUrl,
  openDirectory
};
