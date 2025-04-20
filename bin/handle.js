const path = require("path");

const server = require("../server/index.js");

const gen = require("../utils/gen.js");
const file = require("../utils/file.js");
const config = require("../config/config.js");
const utils = require("../utils/utils.js");
const ad = require("../utils/ad.js");
const dayjs = require("dayjs");
/**
 * @typedef {import('../index')} AppConfig
 */

/**
 *
 * @param {AppConfig} hb_cli
 * @param {object} answers
 * @param {'打包'| '改版本号'| 'Wifi调试'} answers.function
 * @param {"android"| "ios"| "android,ios"| "appResource"| "wgt"} answers.platform
 * @param {boolean} answers.iscustom false:正式版、true:自定义基座
 * @param {boolean} answers.changeVersion 改版本号

 * @param {'openWifiDebugAndConnect'|'connectToPhone'} answers.wifi 安卓Wifi调试[]
 * @param {string} answers.selectPhoneIP 选择的手机IP
 * @param {string} answers.inputPhoneIP 输入的手机IP
 *
 * @param {object} NewManifestConfig 新的manifest.json配置项
 * @param {string} NewManifestConfig.versionName 版本号
 * @param {number} NewManifestConfig.versionCode 版本号
 * @param {string} NewManifestConfig.name 应用名称
 * @param {object} packConfig 打包配置项
 * @param {string} newVersion 新的版本号

 * @param {string[]} AndroidIpList 安卓设备ip列表
 */
async function handle(
  hb_cli,
  answers,
  NewManifestConfig,
  packConfig,
  newVersion,
  AndroidIpList
) {
  let appConfig = hb_cli.appConfig?.create?.();
  // 创建环境变量文件
  if (appConfig) {
    let filePath = config.genEnvConfigFile;
    if (hb_cli?.appConfig?.output) {
      filePath = path.join(config.workDir, hb_cli?.appConfig?.output);
    }
    await gen.generateCode(filePath, appConfig);
  }

  if (answers.changeVersion == true) {
    NewManifestConfig.versionName = newVersion;
    NewManifestConfig.versionCode = Number(NewManifestConfig.versionCode) + 1;
  }
  // console.log("NewManifestConfig", answers.changeVersion, newVersion);

  await utils.WriteConfig(config.manifestFileName, NewManifestConfig);

  var ip = "";
  if (answers.inputPhoneIP) {
    ip = answers.inputPhoneIP;
  } else if (answers.selectPhoneIP && answers.selectPhoneIP != "自定义IP") {
    ip = answers.selectPhoneIP;
  }

  if (ip && !AndroidIpList.includes(ip)) {
    console.log("缓存IP：", config.IpFile);
    await utils.WriteConfig(config.IpFile, [...AndroidIpList, ip]);
  }

  if (answers.wifi == "openWifiDebugAndConnect") {
    let wifiStatus = await utils.OpenWifiDebug();
    if (wifiStatus == 0) {
      await utils.ConnectPhoneWithWifi(ip);
    }
  }
  if (answers.wifi == "connectToPhone") {
    await utils.ConnectPhoneWithWifi(ip);
  }

  if (answers.function == "打包") {
    var OpenHBuilderCode = await utils.OpenHBuilder();
    if (OpenHBuilderCode !== 0) {
      return "打开HBuilder编辑器失败";
    }

    // 是否打包
    let apps = [];
    let apkPath = "";
    let hooks = [];
    // appFileUrl是本地文件路径时，是安卓，https开头是ios在线地址
    if (["android", "ios", "android,ios"].includes(answers.platform)) {
      let hbuilderconfig = utils.MergeHBuilderConfig(packConfig, {
        iscustom: answers.iscustom,
        platform: answers.platform,
      });

      await utils.WriteConfig(config.ConfigFileTemp, hbuilderconfig);

      apps = await utils.buildApp(answers.iscustom);

      apps.map(async (appUrl) => {
        let platform = "";

        if (appUrl && appUrl.indexOf("https") == 0) {
          platform = "ios";
          appUrl = await file.downloadFile(
            appUrl,
            config.workDir + "/unpackage/release/ipa",
            NewManifestConfig.name +
              "_" +
              dayjs().format("YYYYMMDDHHmm") +
              ".ipa"
          );
        } else if (appUrl) {
          platform = "android";
          apkPath = appUrl;
        }
        console.log("本地文件：", appUrl);
        utils.openDirectory(path.resolve(appUrl));
        if (hb_cli?.onPackEnd) {
          hooks.push(hb_cli.onPackEnd(appUrl, platform));
        }
      });
    } else if (answers.platform == "wgt") {
      apps = await utils.buildWgtCli(packConfig);

      for (let i = 0; i < apps.length; i++) {
        console.log("本地文件：", path.resolve(apps[i]));

        utils.openDirectory(path.resolve(apps[i]));

        if (hb_cli?.onPackEnd) {
          hooks.push(hb_cli.onPackEnd(path.resolve(apps[i]), "wgt"));
        }
      }
    } else if (answers.platform == "appResource") {
      apps = await utils.buildAppResourceCli(packConfig);

      for (let i = 0; i < apps.length; i++) {
        console.log("本地目录：", path.resolve(apps[i]));

        // await utils.sleep(2000);
        utils.openDirectory(path.resolve(apps[i]));

        if (hb_cli?.onPackEnd) {
          hooks.push(hb_cli.onPackEnd(path.resolve(apps[i]), "appResource"));
        }
      }
    }
    if (hooks.length) {
      await Promise.allSettled(hooks);
    }
    if (apkPath && answers.iscustom === false) {
      //正式版并且是安卓才启动文件服务
      server.init(apkPath);
    }

  }

  ad.printAd();
}
module.exports = { handle };
