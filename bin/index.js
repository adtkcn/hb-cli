#!/usr/bin/env node

const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require("../utils/utils.js");
const config = require("../config/config.js");

const server = require("../server/server.js");

const workDir = process.cwd();

console.log("workDir", workDir);

async function main() {
  var HBuilderConfig = await utils
    .readConfig(config.ConfigFileName)
    .catch(function (err) {
      console.log(err);
    });
  var manifest = await utils.readConfig("manifest.json").catch(function (err) {
    console.log(err);
  });

  if (!HBuilderConfig || !manifest) {
    return;
  }

  let newVersionCode = parseInt(manifest.versionCode) + 1;
  let VersionNameArr = manifest.versionName.split(".");
  let newVersion_1 = [
    VersionNameArr[0],
    VersionNameArr[1],
    parseInt(VersionNameArr[VersionNameArr.length - 1]) + 1,
  ].join(".");
  let newVersion_2 = [
    VersionNameArr[0],
    VersionNameArr[1],
    dayjs().format("YYYYMMDDHHmm"),
  ].join(".");
  let newVersion_3 = dayjs().format("YYYY.MM.DDHHmm");

  inquirer
    .prompt([
      {
        type: "confirm",
        message: "是否打包" + HBuilderConfig.project,
        name: "isPackage",
        prefix: "",
      },
      {
        type: "list",
        message: "打包正式版 还是 自定义基座（开发）",
        name: "iscustom",
        choices: ["正式版", "自定义基座"],
        when: function (answers) {
          return answers.isPackage;
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
          return answers.isPackage;
        },
      },
      {
        type: "list",
        message: `更改版本号 ${manifest.versionName} : ${manifest.versionCode}`,
        name: "updateVersion",
        choices: ["不更改版本", newVersion_1, newVersion_2, newVersion_3],
        filter: (val) => {
          //将选择的内容后面加内容
          return val;
        },
      },
    ])
    .then(async function (answers) {
      if (answers.updateVersion != "不更改版本") {
        manifest.versionName = answers.updateVersion;
        manifest.versionCode = newVersionCode;
        let ManifestConfig = utils.MergeManifestConfig(manifest);
        // console.log(ManifestConfig);
        await utils.WriteConfig("manifest.json", ManifestConfig);
      }
      if (answers.isPackage) {
        // 是否打包
        let hbuilderconfig = utils.MergeHBuilderConfig(HBuilderConfig, {
          iscustom: answers.iscustom,
          platform: answers.platform,
        });
        // console.log(hbuilderconfig);
        await utils.WriteConfig(config.ConfigFileTemp, hbuilderconfig);
        server.init();

        await utils
          .buildApp()
          .catch(function (err) {
            console.log(err);
            server.exit();
          })
          .then((res) => {
            console.log(res);
          });
      }
      console.log("answers", answers);
      // Use user feedback for... whatever!!
    })
    .catch(function (err) {
      console.log(err);
    });
}
main();
