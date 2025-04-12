const inquirer = require("inquirer");
const dayjs = require("dayjs");
const utils = require("../utils/utils.js");

const config = require("../config/config.js");

const { handle } = require("./handle.js");

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
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    console.log(
      "hb-cli.config.js文件读取错误\n",
      "请在项目根目录下运行命令或者创建hb-cli.config.js文件"
    );
  }
  if (!hb_cli) {
    return;
  }
  let manifest = await utils
    .readConfig(config.manifestFileName)
    .catch(function (err) {
      console.log(
        "manifest.json文件读取错误，检查是否在项目根目录执行命令",
        err
      );
    });
  if (!manifest) {
    return;
  }

  let packConfig = hb_cli.packConfig?.();
  let manifestConfig = hb_cli.mergeManifestConfig?.();
  let envConfig = hb_cli.createEnv?.();
  let versionMode = hb_cli?.version?.mode || "auto-increment";

  let VersionNameArr = manifest.versionName.split(".");
  let newVersion = "";
  if (versionMode == "auto-increment") {
    const lastIndex = VersionNameArr.length - 1;
    VersionNameArr[lastIndex] = parseInt(VersionNameArr[lastIndex]) + 1;
    newVersion = VersionNameArr.join(".");
  } else if (versionMode == "date") {
    newVersion = dayjs().format("YYYY.MM.DDHHmm");
  } else if (versionMode == "custom") {
    newVersion = hb_cli.version?.customVersion?.([...VersionNameArr]);
  }

  if (!packConfig) {
    console.error("请定义packConfig函数并返回数据");
    return;
  }
  console.log("读取pack配置", packConfig);
  console.log("读取manifest配置", manifestConfig);
  console.log("读取env配置", envConfig);

  // 合并后的manifest
  const NewManifestConfig = utils.MergeManifestConfig(manifest, manifestConfig);
  // console.log("合并后的manifest", NewManifestConfig);
  let AndroidIpList = [];
  try {
    AndroidIpList = await utils.readConfig(config.IpFile);
  } catch (error) {
    AndroidIpList = [];
    console.log(error);
  }

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
      // {
      //   type: "list",
      //   message: `环境变量`,
      //   name: "env",
      //   choices:  ,
      //   when: function (answers) {
      //     return (
      //        .length &&
      //       (answers.function == "环境变量" || answers.function == "打包")
      //     );
      //   },
      // },
      // {
      //   type: "list",
      //   message: `更换配置`,
      //   name: "config",
      //   choices: configOptions,
      //   when: function (answers) {
      //     return configOptions.length && answers.function == "打包";
      //   },
      // },
      {
        type: "list",
        message: `安卓Wifi调试(手机需先开启usb调试并连接usb一次)`,
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
        envConfig,
        AndroidIpList
      )
    )
    .catch(function (err) {
      console.log("错误信息：", err);
    });
}

module.exports = { prompt };
