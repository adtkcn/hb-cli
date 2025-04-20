const path = require("path");
const os = require("os");
const fs = require("fs");
const cp = require("child_process");
const JSON5 = require("json5");
var iconv = require("iconv-lite");

const config = require("../config/config.js");
const { deepAssign } = require("./merge.js");

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
          console.log("打开HBuilder编辑器成功");
          // 给hbuilder加载时间
          setTimeout(() => {
            resolve(0);
          }, 4000);
        } else {
          console.log("打开HBuilder编辑器失败");
          reject(1);
        }
      });
    } catch (error) {
      console.log("打开HBuilder编辑器错误", error);
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
      cp.exec(`xdg-open "${url}"`);
  }
}

/**
 * 读取工作目录配置文件
 * @param {string} FileName
 * @returns {Promise<any>}
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
 * @param {string|object} Config
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
        if (typeof Config == "string") {
          fs.writeFileSync(ConfigFilePath, Config);
        } else if (typeof Config == "object") {
          fs.writeFileSync(
            ConfigFilePath,
            JSON.stringify(Config, undefined, "\t")
          );
        }

        resolve(ConfigFilePath);
      }
    );
  });
}

/**
 * 合并HBuilderConfig配置文件
 * @param {object} packConfig
 * @param {object} packConfig.android
 * @param {string} packConfig.android.certfile
 * @param {object} packConfig.ios
 * @param {string} packConfig.ios.profile
 * @param {string} packConfig.ios.certfile
 * @param {object} info
 * @return {object}
 */
function MergeHBuilderConfig(packConfig, info = {}) {
  var newConfig = deepAssign({}, packConfig, info);
  newConfig.android.certfile = newConfig.android.certfile
    ? path.join(workDir, newConfig.android.certfile)
    : "";
  newConfig.ios.profile = newConfig.ios.profile
    ? path.join(workDir, newConfig.ios.profile)
    : "";
  newConfig.ios.certfile = newConfig.ios.certfile
    ? path.join(workDir, newConfig.ios.certfile)
    : "";
  return newConfig;
}
/**
 *
 * @param {object} ManifestConfig
 * @param {object} info
 * @returns {object}
 */
function MergeManifestConfig(ManifestConfig = {}, info = {}) {
  var newConfig = deepAssign({}, ManifestConfig, info);
  // var str = JSON.stringify(newConfig, undefined, "\t");
  return newConfig;
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
 *
 * @param {boolean} isCustom 是不是自定义基座
 * @returns
 */
async function buildApp(isCustom) {
  return new Promise((resolve, reject) => {
    try {
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
            reject(data);
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
/**
 * 导出wgt包
 * @param {object} HBuilderConfig
 * @param {string} HBuilderConfig.project 项目名称
 * @param {boolean} HBuilderConfig.isconfusion 是否混淆
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
        "--confuse",HBuilderConfig.isconfusion||false,//混淆
      ],
      function (code, data) {
        if (code == 0) {
          resolve(apps);
        } else if (code == -1 && data) {
          //自定义异常
          console.log(data);
          reject(data);
        } else if (code == -2 && data) {
          //进程正常返回数据
          console.log(data);

          if (data.indexOf(`导出成功，路径为：`) != -1) {
            var appPath = data.split("导出成功，路径为：")[1];

            if (!appPath) {
              reject("打包的路径获取出错");
              return;
            }
            //从appPath中截取以.wgt结尾
            appPath = appPath.split(".wgt")[0] + ".wgt";
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
 * @param {string} HBuilderConfig.project
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
          reject(data);
        } else if (code == -2 && data) {
          //进程正常返回数据
          console.log(data);

          if (data.indexOf(`导出成功，路径为：`) != -1) {
            let appPath = data.split("导出成功，路径为：")[1];

            if (!appPath) {
              reject("打包的路径获取出错");
              return;
            }
            //从appPath中截取以resources结尾
            appPath = appPath.split("resources")[0] + "resources";
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
 * 从字符串中提取首个URL地址
 * @param {string} str - 需要解析的原始字符串
 * @returns {string|null} 返回找到的第一个URL地址，未找到返回null
 */
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
 * 打开指定目录:nodejs封装方法打开指定目录，兼容win,mac,linux
 * @param {string} filePath 文件路径
 */
function openDirectory(filePath) {
  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(filePath);

    // 检查路径是否存在
    // if (!fs.existsSync(absolutePath)) {
    //   console.error("路径不存在：", absolutePath);
    //   return;
    // }

    // 获取路径信息（文件 or 文件夹）
    const isDirectory = fs.statSync(absolutePath).isDirectory();
    let command;

    if (process.platform === "win32") {
      // Windows
      if (isDirectory) {
        command = `start ${absolutePath}`; // 直接打开文件夹
      } else {
        const parentDirectory = path.dirname(filePath);
        command = `start ${parentDirectory}`; // 打开文件夹并
      }
    } else if (process.platform === "darwin") {
      // macOS
      if (isDirectory) {
        command = `open "${absolutePath}"`; // 直接打开文件夹
      } else {
        command = `open -R "${absolutePath}"`; // 打开文件夹并定位到文件
      }
    } else {
      // Linux (使用 xdg-open)
      command = `xdg-open "${
        isDirectory ? absolutePath : path.dirname(absolutePath)
      }"`;
    }

    // 执行命令
    cp.exec(command, (error) => {
      if (error) {
        console.error("Failed to open location:", error);
        reject(error);
        return;
      }
      resolve(0);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms)); 
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
  openDirectory,sleep
};
