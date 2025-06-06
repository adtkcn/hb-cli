const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require("../utils/utils.js");

const config = require("../config/config.js");

const { handle } = require("./handle.js");

/**
 *
 * @param {object} options
 * @param {string} options.mode 打包模式
 * @returns
 */
async function prompt(options) {
  // 读取hb-cli.config.js文件
  let hb_cli = null;
  try {
    const hb_cli_config = require(config.ConfigFileName);
    if (typeof hb_cli_config == "function") {
      hb_cli = hb_cli_config(options);
    } else {
      hb_cli = hb_cli_config;
    }
  } catch (err) {
    console.log(
      "hb-cli.config.js文件读取错误\n",
      "请在项目根目录下运行命令或者创建hb-cli.config.js文件\n",
      err
    );
  }
  if (!hb_cli) {
    return;
  }
  let manifest = await utils
    .readConfig(config.manifestFileName)
    .catch(function (err) {
      console.log(
        "manifest.json文件读取错误，检查是否在项目根目录执行命令\n",
        err
      );
    });
  if (!manifest) {
    return;
  }

  let packConfig = hb_cli.packConfig?.();
  let manifestConfig = hb_cli.mergeManifestConfig?.();

  let versionMode = hb_cli?.version?.mode || "auto-increment";

  let VersionNameArr = manifest.versionName.split(".");
  let newVersion = "";
  switch (versionMode) {
    case "auto-increment": {
      const lastIndex = VersionNameArr.length - 1;
      VersionNameArr[lastIndex] = parseInt(VersionNameArr[lastIndex]) + 1;
      newVersion = VersionNameArr.join(".");
      break;
    }
    case "date":
      newVersion = dayjs().format("YYYY.MM.DDHHmm");
      break;
    case "custom":
      newVersion = hb_cli.version?.customVersion?.([...VersionNameArr]);
      break;
  }

  if (!packConfig) {
    console.error("请定义packConfig函数并返回数据");
    return;
  }
  // console.log("读取pack配置", packConfig);
  // console.log("读取manifest配置", manifestConfig);


  // 合并后的manifest
  const NewManifestConfig = utils.MergeManifestConfig(manifest, manifestConfig);
  // console.log("合并后的manifest", NewManifestConfig);
  let AndroidIpList = [];
  try {
    AndroidIpList = await utils.readConfig(config.IpFile);
  } catch (error) {
    AndroidIpList = [];
    // console.log(error);
  }

  inquirer
    .prompt([
      {
        type: "list",
        message: "选择功能",
        name: "function",
        choices: ["打包", "改版本号", "Wifi调试"],
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
        message: `更改版本号：${manifest.versionName} -> ${newVersion}`,
        name: "changeVersion",
        choices: ["是", "否"],
        when: function (answers) {
          return answers.function == "改版本号" || answers.function == "打包";
        },
        filter: (val) => {
          //将选择的内容后面加内容
          if (val == "否") {
            return false;
          }
          return true;
        },
      },
      {
        type: "list",
        message: `安卓Wifi调试`,
        name: "wifi",
        choices: [
          {
            name: "打开手机调试并连接(手机需先开启usb调试,并连接usb一次)",
            value: "openWifiDebugAndConnect",
          },
          {
            name: "连接到手机(用于重新连接,不用连接usb)",
            value: "connectToPhone",
          },
        ],
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
          return answers.function == "Wifi调试" && AndroidIpList.length > 0;
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
      handle(
        hb_cli,
        answers,
        NewManifestConfig,
        packConfig,
        newVersion,
        AndroidIpList
      )
    )
    .catch(function (err) {
      console.log("错误信息：", err);
    });
}

module.exports = { prompt };
