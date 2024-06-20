#!/usr/bin/env node

// const cp = require("child_process");
const path = require("path");
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
  let AndroidIpList = [];
  try {
    AndroidIpList = await utils.readConfig(config.IpFile);
  } catch (error) {
    AndroidIpList = [];
    console.log(error);
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

  // let newVersionCode =
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
        message: "打包平台",
        name: "platform",
        choices: ["android", "ios", "android,ios", "appResource", "wgt"],
        // # 生成本地打包appResource
        // cli publish --platform APP --type appResource --project 项目名称
        // # 导出wgt包，自定义导出路径和名称
        // cli publish --platform APP --type wgt --project 项目名称 --path 导出路径 --name 导出名称
        when: function (answers) {
          return answers.function == "打包";
        },
      },
      {
        type: "list",
        message: "选择打包模式",
        name: "iscustom",
        choices: ["正式版", "自定义基座"],
        when: function (answers) {
          return (
            answers.function == "打包" &&
            ["android", "ios", "android,ios"].includes(answers.platform)
          );
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
        message: `版本号 version:${manifest.versionName} 、code:${manifest.versionCode}`,
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
        choices: ["自定义IP", ...AndroidIpList],
        when: function (answers) {
          return answers.function == "Wifi调试";
        },
      },
      {
        type: "input",
        name: "inputPhoneIP", // 输入的手机IP
        message: "输入手机IP", // 提示信息
        validate: function (v) {
          return v.split(".").length == 4;
        },
        when: function (answers) {
          return (
            answers.function == "Wifi调试" &&
            (answers.selectPhoneIP == "自定义IP" || AndroidIpList.length == 0)
          );
        },
      },
    ])
    .then((answers) =>
      handlePrompt(answers, manifest, HBuilderConfig, envOptions, AndroidIpList)
    )
    .catch(function (err) {
      console.log("错误信息：", err);
    });
}

/**
 *
 * @param {object} answers
 * @param {"打包"| "改版本号"| "环境变量"| "Wifi调试"} answers.function
 * @param {"android"| "ios"| "android,ios"| "appResource"| "wgt"} answers.platform
 * @param {boolean} answers.iscustom false:正式版、true:自定义基座
 * @param {object} answers.updateVersion
 * @param {object} answers.envOptions
 * @param {object} answers.config
 * @param {"打开手机调试并连接"|"连接到手机"} answers.wifi 安卓Wifi调试[]
 * @param {string} answers.selectPhoneIP 选择的手机IP
 * @param {object} answers.inputPhoneIP 输入的手机IP
 *
 *
 * @param {object} manifest
 * @param {object} HBuilderConfig
 * @param {string[]} envOptions 环境变量名称
 * @param {string[]} AndroidIpList 安卓设备ip列表
 */
async function handlePrompt(
  answers,
  manifest,
  HBuilderConfig,
  envOptions,
  AndroidIpList
) {
  // console.log("answers", answers);
  if (answers.function == "环境变量" && envOptions.length == 0) {
    console.log("环境变量：请在HBuilderConfig.json文件中定义hb_cli.env对象");
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
    HBuilderConfig = merge.deepAssign({}, HBuilderConfig, newHBuilderConfig);
  }

  if (
    (answers.function == "改版本号" || answers.function == "打包") &&
    answers.updateVersion != "不更改版本"
  ) {
    manifest.versionName = answers.updateVersion;
    manifest.versionCode = parseInt(manifest.versionCode) + 1;
    let ManifestConfig = utils.MergeManifestConfig(manifest);

    await utils.WriteConfig("manifest.json", ManifestConfig);
  }

  var ip = "";
  if (answers.inputPhoneIP) {
    ip = answers.inputPhoneIP;
  } else if (answers.selectPhoneIP && answers.selectPhoneIP != "自定义IP") {
    ip = answers.selectPhoneIP;
  }

  if (ip && !AndroidIpList.includes(ip)) {
    console.log("写入IP文件：", config.IpFile);
    utils.WriteConfig(config.IpFile, JSON.stringify([...AndroidIpList, ip]));
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

    // appFileUrl是本地文件路径时，是安卓，https开头是ios在线地址
    if (["android", "ios", "android,ios"].includes(answers.platform)) {
      let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
        iscustom: answers.iscustom,
        platform: answers.platform,
      });
      if (hbuilderconfig.hb_cli) {
        //删除自定义数据部分
        delete hbuilderconfig.hb_cli;
      }
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
        if (appUrl && appUrl.indexOf("https") == 0) {
          appUrl = await file.downloadFile(
            appUrl,
            config.workDir + "/" + "unpackage/release/ipa",
            manifest.name + "_" + dayjs().format("YYYYMMDDHHmm") + ".ipa"
          );
        } else if (appUrl) {
          // 安卓才打开浏览器，ios直接打开没用，所有暂时不打开

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
              console.log("上传错误", err);
            });
        }
      });
    } else if (answers.platform == "wgt") {
      let apps = await utils.buildWgtCli(HBuilderConfig);
      if (process.platform == "win32") {
        for (let i = 0; i < apps.length; i++) {
          console.log("explorer.exe /select," + apps[i]);
          // cp.exec("explorer.exe /select," + apps[i]);
          utils.openDirectory(apps[i]);
        }
      }
    } else if (answers.platform == "appResource") {
      let apps = await utils.buildAppResourceCli(HBuilderConfig);
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

main();
