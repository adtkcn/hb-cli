const server = require("../server/server.js");

const gen = require("../utils/gen.js");
const file = require("../utils/file.js");
const config = require("../config/config.js");
const utils = require("../utils/utils.js");
const dayjs = require("dayjs");
/**
 *
 * @param {object} hb_cli
 * @param {object} answers
 * @param {'打包'| '改版本号'| '环境变量'| 'Wifi调试'} answers.function
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
 * @param {object} envConfig 环境变量配置项

 * @param {string[]} AndroidIpList 安卓设备ip列表
 */
async function handle(
  hb_cli,
  answers,
  NewManifestConfig,
  packConfig,
  newVersion,
  envConfig,
  AndroidIpList
) {
  // 创建环境变量文件
  if (envConfig) {
    await gen.generateCode(envConfig);
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
    console.log("写入IP文件：", config.IpFile);
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
    // 是否打包

    // appFileUrl是本地文件路径时，是安卓，https开头是ios在线地址
    if (["android", "ios", "android,ios"].includes(answers.platform)) {
      let hbuilderconfig = utils.MergeHBuilderConfig(packConfig, {
        iscustom: answers.iscustom,
        platform: answers.platform,
      });

      await utils.WriteConfig(config.ConfigFileTemp, hbuilderconfig);

      let apps = await utils.buildApp(answers.iscustom);
      if (
        apps.length &&
        answers.iscustom === false &&
        ["android", "android,ios"].includes(answers.platform)
      ) {
        //正式版并且是安卓才启动文件服务
        server.init();
      }
      apps.map(async (appUrl) => {
        let platform = "";

        if (appUrl && appUrl.indexOf("https") == 0) {
          platform = "ios";
          appUrl = await file.downloadFile(
            appUrl,
            config.workDir + "/" + "unpackage/release/ipa",
            NewManifestConfig.name +
              "_" +
              dayjs().format("YYYYMMDDHHmm") +
              ".ipa"
          );
        } else if (appUrl) {
          // 安卓才打开浏览器，ios直接打开没用，所有不打开
          platform = "android";
          let url = `http://${utils.getLocalIP()}:${
            config.port
          }?link=${encodeURIComponent(appUrl)}`;

          utils.openDefaultBrowser(url);
        }
        console.log("本地目录：", appUrl);

        if (hb_cli?.upload) {
          await hb_cli.upload(appUrl, platform);
        }
      });
    } else if (answers.platform == "wgt") {
      let apps = await utils.buildWgtCli(packConfig);
      if (process.platform == "win32") {
        for (let i = 0; i < apps.length; i++) {
          console.log("explorer.exe /select," + apps[i]);
          // cp.exec("explorer.exe /select," + apps[i]);
          utils.openDirectory(apps[i]);

          if (hb_cli?.upload) {
            await hb_cli.upload(apps[i], "wgt");
          }
        }
      }
    } else if (answers.platform == "appResource") {
      let apps = await utils.buildAppResourceCli(packConfig);
      if (process.platform == "win32") {
        for (let i = 0; i < apps.length; i++) {
          console.log("explorer.exe /select," + apps[i]);
          // cp.exec("explorer.exe /select," + apps[i]);
          utils.openDirectory(apps[i]);
        }
      }
    }
  }
}
module.exports = { handle };
