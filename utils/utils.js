const path = require("path");
const os = require("os");
const fs = require("fs");
const cp = require("child_process");
const JSON5 = require("json5");
var iconv = require("iconv-lite");

const config = require("../config/config.js");

var workDir = process.cwd();
console.log("workDir", workDir);

/**
 *获取 HBuilder的Cli路径
 *
 * @return {string} HBuilderCli
 */
function GetHBuilderCli() {
  var HBuilderDir = "";
  if (process.env.HBuilder) {
    HBuilderDir = process.env.HBuilder;
  }
  HBuilderDir = path.join(HBuilderDir, "cli");
  console.log("HBuilderDir完整路径: ", HBuilderDir);
  return HBuilderDir;
}
/**
 * 打开HBuilder编辑器
 * @returns
 */
function OpenHBuilder() {
  return new Promise(async (resolve, reject) => {
    try {
      var HBuilderConfig = await readConfig(config.ConfigFileName).catch(
        function (err) {
          console.log(err);
        }
      );
      if (!HBuilderConfig) {
        reject(1);
        return;
      }
      var HBuilderCli = GetHBuilderCli();
      var ls = cp.spawn(HBuilderCli, ["open"], {});
      ls.on("exit", function (code) {
        console.log("openHBuilder 状态： " + code);
        if (code === 0) {
          setTimeout(() => {
            resolve(0);
          }, 1000);
        } else {
          callback && callback(code);
          reject(code);
        }
      });
    } catch (error) {
      console.log("error", error);
      reject(1);
    }
  });
}

/**
 * 获取本机ip
 *
 * @return {string}
 */
function getLocalIP() {
  const osType = os.type(); //系统类型
  const netInfo = os.networkInterfaces(); //网络信息
  let ip = "";

  console.log(osType, netInfo);

  if (osType === "Windows_NT") {
    for (let dev in netInfo) {
      console.log(dev);
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
  // console.log(process.platform);
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
 */
function readConfig(FileName) {
  return new Promise((resolve, reject) => {
    var ConfigFilePath = path.join(workDir, FileName);
    fs.readFile(ConfigFilePath, function (err, data) {
      if (err) {
        reject("读取配置文件错误,检查是否存在" + ConfigFilePath);
        return;
      }
      var d = String(data);
      try {
        var c = JSON5.parse(d);
        resolve(c);
      } catch (error) {
        reject(error);
      }
    });
  });
}
/**
 * 更改配置文件
 * @param {*} ConfigFilePath
 * @param {*} Config
 * @returns
 */
function WriteConfig(ConfigFilePath, str = "") {
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
        fs.writeFileSync(ConfigFilePath, str);
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
 *打包app
 *
 * @param {*} rootPath 项目路径
 * @param { string } HBuilderConfigFileTemp 临时配置文件路径
 * @param { CallbackHandler } callback
 */
function buildAppCli(HBuilderConfigFileTemp, callback) {
  var HBuilderCli = GetHBuilderCli();

  // D:\办公\HBuilderX\cli pack --config e:\icpc_workspace_2\shougang\APP\zdhlAliyunApp\HBuilderConfig.json
  console.log(HBuilderCli, ["pack", "--config", HBuilderConfigFileTemp]);

  var pack = cp.spawn(HBuilderCli, [
    "pack",
    "--config",
    HBuilderConfigFileTemp,
  ]);
  pack.stdout.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-2, str);
  });

  pack.stderr.on("data", (data) => {
    var str = iconv.decode(Buffer.from(data, "binary"), "GBK");
    callback && callback(-3, str);
  });

  pack.on("exit", function (code) {
    console.log("buildApp code " + code);
    callback && callback(code);
  });
}
function buildApp() {
  return new Promise(async (resolve, reject) => {
    try {
      var OpenHBuilderCode = await OpenHBuilder();
      if (OpenHBuilderCode !== 0) {
        console.log(OpenHBuilderCode);
        reject(OpenHBuilderCode);
        return;
      }

      buildAppCli(config.ConfigFileTemp, function (code, data) {
        // code==-1 自定义错误code,-2是正常数据,-3是错误数据, 其他是进程code

        if (code == -1 && data) {
          //自定义异常
          console.log(data);
          reject(-1, data);
        } else if (code == -2 && data) {
          //进程正常返回数据
          console.log(data); // 追加一行

          if (
            data.indexOf("打包成功") != -1 &&
            data.indexOf("安装包位置：") != -1
          ) {
            // 打包成功    安装包位置：E:/xiangheng/通知订阅/消息订阅/unpackage/release/apk/__UNI__ECA51B4__20220426171608.apk
            var appPath = data.split("安装包位置：")[1];

            if (!appPath) {
              console.log("打包的路径获取出错"); // 输出日志
              reject(-3, "打包的路径获取出错");
              return;
            }
            var newAppPath = appPath
              .replace(/\//g, "\\")
              .replace(/\n/g, "")
              .replace(/(\s*$)/g, "");

            // if (process.platform == "win32") {
            //   cp.exec("explorer.exe /select," + newAppPath);
            // }

            var link = encodeURIComponent(newAppPath);
            var url = `http://${getLocalIP()}:${config.port}?link=${link}`;
            console.log("地址：", url);
            console.log("ctrl+c 可以关闭终端");
            openDefaultBrowser(url);
          }
        } else if (code == -3 && data) {
          //进程异常返回数据
          console.log(data); // 追加一行
          reject(-3);
        }
      });
    } catch (error) {
      console.log("error", error);
    }
  });
}
module.exports = {
  GetHBuilderCli,
  openDefaultBrowser,
  getLocalIP,
  readConfig,
  MergeHBuilderConfig,
  MergeManifestConfig,
  WriteConfig,
  buildApp,
};
