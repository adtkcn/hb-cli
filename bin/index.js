#!/usr/bin/env node

const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require("../utils/utils.js");
const merge = require("../utils/merge.js");
const gen = require("../utils/gen.js");

const file = require("../utils/file.js");

const config = require("../config/config.js");

const server = require("../server/server.js");

async function main() {
  let HBuilderConfig = await utils
    .readConfig(config.ConfigFileName)
    .catch(function (err) {
      console.log(err);
    });
  let manifest = await utils
    .readConfig(config.manifestFileName)
    .catch(function (err) {
      console.log(err);
    });
  let ipList = [];
  try {
    ipList = await utils.readConfig(config.IpFile);
  } catch (error) {
    ipList = [];
  }

  if (!HBuilderConfig || !manifest) {
    return;
  }
  let envOptions = [];
  if (HBuilderConfig?.hb_cli?.env) {
    envOptions = Object.keys(HBuilderConfig.hb_cli.env);
  }
  let configOptions = [];
  if (HBuilderConfig?.hb_cli?.HBuilderConfig) {
    configOptions = Object.keys(HBuilderConfig.hb_cli.HBuilderConfig);
  }

  let newVersionCode = parseInt(manifest.versionCode) + 1;
  let VersionNameArr = manifest.versionName.split(".");
  let newVersion_1 = [
    VersionNameArr[0],
    VersionNameArr[1],
    parseInt(VersionNameArr[VersionNameArr.length - 1]) + 1,
  ].join(".");
  let newVersion_2 = dayjs().format("YYYY.MM.DDHHmm");

  inquirer
    .prompt([
      {
        type: "list",
        message: "选择功能",
        name: "function",
        choices: ["打包", "改版本号", "环境变量", "Wifi调试"],
      },
      {
        type: "list",
        message: "选择打包模式",
        name: "iscustom",
        choices: ["正式版", "自定义基座"],
        when: function (answers) {
          return answers.function == "打包";
        },
        filter: (val) => {
          //将选择的内容后面加内容
          if (val == "正式版") {
            return false;
          }
          return true;
        },
      },
      {
        type: "list",
        message: "打包平台",
        name: "platform",
        choices: ["android", "ios", "android,ios"],
        when: function (answers) {
          return answers.function == "打包";
        },
      },
      {
        type: "list",
        message: `更改版本号 ${manifest.versionName} : ${manifest.versionCode}`,
        name: "updateVersion",
        choices: ["不更改版本", newVersion_1, newVersion_2],
        when: function (answers) {
          return answers.function == "改版本号" || answers.function == "打包";
        },
      },
      {
        type: "list",
        message: `环境变量`,
        name: "env",
        choices: envOptions,
        when: function (answers) {
          return (
            envOptions.length &&
            (answers.function == "环境变量" || answers.function == "打包")
          );
        },
      },
      {
        type: "list",
        message: `更换配置`,
        name: "config",
        choices: configOptions,
        when: function (answers) {
          return configOptions.length && answers.function == "打包";
        },
      },
      {
        type: "list",
        message: `安卓Wifi调试`,
        name: "wifi",
        choices: ["打开手机调试并连接", "连接到手机"],
        when: function (answers) {
          return answers.function == "Wifi调试";
        },
      },
      {
        type: "list",
        message: `选择手机IP`,
        name: "selectPhoneIP",
        choices: ["自定义IP", ...ipList],
        when: function (answers) {
          return answers.function == "Wifi调试";
        },
      },
      {
        type: "input", // 类型
        name: "inputPhoneIP", // 字段名称，在then里可以打印出来
        message: "输入手机IP", // 提示信息
        validate: function (v) {
          return v.split(".").length == 4;
        },
        when: function (answers) {
          return (
            answers.function == "Wifi调试" &&
            (answers.selectPhoneIP == "自定义IP" || ipList.length == 0)
          );
        },
      },
    ])
    .then(async function (answers) {
      // console.log("answers", answers);
      if (answers.function == "环境变量" && envOptions.length == 0) {
        console.log(
          "环境变量：请在HBuilderConfig.json文件中定义hb_cli.env对象"
        );
      }
      if (answers.env) {
        let env = merge.deepAssign(
          {},
          HBuilderConfig.hb_cli.env["base"],
          HBuilderConfig.hb_cli.env[answers.env]
        );
        gen.generateCode(env);
      }
      if (answers.config) {
        let newHBuilderConfig = merge.deepAssign(
          {},
          HBuilderConfig.hb_cli.HBuilderConfig["base"],
          HBuilderConfig.hb_cli.HBuilderConfig[answers.config]
        );
        HBuilderConfig = merge.deepAssign(
          {},
          HBuilderConfig,
          newHBuilderConfig
        );
      }

      if (
        (answers.function == "改版本号" || answers.function == "打包") &&
        answers.updateVersion != "不更改版本"
      ) {
        manifest.versionName = answers.updateVersion;
        manifest.versionCode = newVersionCode;
        let ManifestConfig = utils.MergeManifestConfig(manifest);

        await utils.WriteConfig("manifest.json", ManifestConfig);
      }

      var ip = "";
      if (answers.inputPhoneIP) {
        ip = answers.inputPhoneIP;
      } else if (answers.selectPhoneIP && answers.selectPhoneIP != "自定义IP") {
        ip = answers.selectPhoneIP;
      }

      if (ip && !ipList.includes(ip)) {
        console.log("写入IP文件：", config.IpFile);
        utils.WriteConfig(config.IpFile, JSON.stringify([...ipList, ip]));
      }

      if (answers.wifi == "打开手机调试并连接") {
        let wifiStatus = await utils.OpenWifiDebug();
        if (wifiStatus == 0) {
          await utils.ConnectPhoneWithWifi(ip);
        }
      }
      if (answers.wifi == "连接到手机") {
        await utils.ConnectPhoneWithWifi(ip);
      }

      if (answers.function == "打包") {
        // 是否打包

        let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
          iscustom: answers.iscustom,
          platform: answers.platform,
        });
        if (hbuilderconfig.hb_cli) {
          //删除自定义数据部分
          delete hbuilderconfig.hb_cli;
        }
        await utils.WriteConfig(config.ConfigFileTemp, hbuilderconfig);
        server.init();
        // appFileUrl是本地文件路径时，是安卓，https开头是ios在线地址
        var apps = await utils.buildApp();

        apps.map(async (appUrl) => {
          if (appUrl && appUrl.indexOf("https") == 0) {
            appUrl = await file.downloadFile(
              appUrl,
              config.workDir + "/" + "unpackage/release/ipa",
              manifest.name + "_" + dayjs().format("YYYYMMDDHHmm") + ".ipa"
            );
          } else if (appUrl) {
            // 安卓才打开浏览器，ios直接打开没用，所有暂时不打卡

            var url = `http://${utils.getLocalIP()}:${
              config.port
            }?link=${encodeURIComponent(appUrl)}`;

            utils.openDefaultBrowser(url);
          }
          console.log("本地目录：", appUrl);

          if (HBuilderConfig?.hb_cli?.upload?.url && appUrl) {
            await file
              .upload(
                HBuilderConfig?.hb_cli?.upload?.url,
                appUrl,
                HBuilderConfig?.hb_cli?.upload?.formData
              )
              .catch((err) => {
                // console.log("上传",err);
              });
          }
        });
      }
    })
    .catch(function (err) {
      console.log("错误信息：", err);
    });
}
main();
