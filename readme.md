
- [https://www.npmjs.com/package/@adtkcn/hb-cli](https://www.npmjs.com/package/@adtkcn/hb-cli)
- [https://github.com/adtkcn/hb-cli](https://github.com/adtkcn/hb-cli)

## 功能
- 简化打包：安卓、ios,本地打包App资源、wgt包
- 切换打包配置：根据`packConfig()`返回的对象打包 
- 切换环境变量：根据`createEnv()`返回的对象生成js文件
- 切换manifest参数：根据`mergeManifestConfig()`返回的对象合并`manifest.json`文件
- 升级manifest版本号：可自动加一、当前日期、自定义版本号
- wifi调试
- 自动下载ios包到本地
- 打包回调：打包完成后回调，可自定义回调函数用于上传等操作


## 运行

- 本地安装 `npm i -D @adtkcn/hb-cli`
- 在项目根目录下创建配置文件 `hb-cli.config.js`
- 系统变量里加入`HBuilder`，指向 HBuilder 编辑器安装目录
![环境变量](./doc/env.png)
- 在项目下运行命令(可以将命令定义在`package.json`中方便使用)
```bash
npx hb-cli --mode base
```

## hb-cli.config.js，内容如下:

`packConfig`返回的对象都是官方配置，其中platform,iscustom字段无需填写

https://hx.dcloud.net.cn/cli/pack?id=config

```js
const { defineConfig } = require("@adtkcn/hb-cli");

/**
 *
 * @param {object} param0
 * @param {string} param0.mode 打包模式,通过命令行参数--mode传入
 * @returns
 */
module.exports = ({ mode }) => {
  console.log("当前mode环境：", mode);

  return defineConfig({
    // 打包配置项，全部为uniapp官方配置(必须)
    packConfig() {
      return {
        //项目名字或项目绝对路径
        project: "消息订阅1",

        //打包平台 默认值android  值有"android","ios" 如果要打多个逗号隔开打包平台
        platform: "android", // 无需填写
        //是否使用自定义基座 默认值false  true自定义基座 false自定义证书
        iscustom: false, // 无需填写
        //打包方式是否为安心打包默认值false,true安心打包,false传统打包
        safemode: true,
        //android打包参数
        android: {
          //安卓包名
          packagename: "cn.adtk.push",
          //安卓打包类型 默认值0： 0 使用自有证书 1 使用公共证书 2 使用老版证书 3云端证书
          androidpacktype: "3",

          //安卓打包证书别名,自有证书打包填写的参数
          certalias: "zdhlapp",
          //安卓打包证书文件路径,自有证书打包填写的参数
          certfile: "a",
          //安卓打包证书密码,自有证书打包填写的参数
          certpassword: "password",
          //安卓平台要打的渠道包 取值有"google","yyb","360","huawei","xiaomi","oppo","vivo"，如果要打多个逗号隔开
          channels: "",
        },
        //ios打包参数
        ios: {
          //ios appid
          bundle: "cn.adtk.push",
          //ios打包支持的设备类型 默认值iPhone 值有"iPhone","iPad" 如果要打多个逗号隔开打包平台
          supporteddevice: "iPhone,iPad",
          //iOS打包是否打越狱包,只有值为true时打越狱包,false打正式包
          isprisonbreak: false,
          //iOS使用自定义证书打包的profile文件路径
          profile: "a",
          //iOS使用自定义证书打包的p12文件路径
          certfile: "a",
          //iOS使用自定义证书打包的证书密码
          certpassword: "",
        },
        //是否混淆 true混淆 false关闭
        isconfusion: false,
        //开屏广告 true打开 false关闭
        splashads: false,
        //悬浮红包广告true打开 false关闭
        rpads: false,
        //push广告 true打开 false关闭
        pushads: false,
        //加入换量联盟 true加入 false不加入
        exchange: false,
      };
    },
    // 自定义manifest.json配置项: 合并到manifest.json中(可选)
    mergeManifestConfig() {
      return {
        name: "消息订阅_11111",
        "app-plus": {
          nvueStyleCompiler: "uni-app_11111",
        },
      };
    },
    /**
     * 创建APP内环境变量，生成HBuilderEnv.js文件（可选）
     * @returns {any} 环境变量
     */
    createEnv() {
      var info = {
        dev: {
          url: "https://base.adtk.cn",
        },
        prod: {
          url: "https://prod.adtk.cn",
        },
      };
      if (mode == "dev") {
        return info.dev;
      }
      return info.prod;
    },
    /**
     * 定义manifest.versionName的生成规则(可选，默认：auto-increment)
     */
    version: {
      mode: "date", // 可选值："custom"、"date"、"auto-increment",
      /**
       * 自定义版本号（可选）
       * @param {string[]} VersionNameArr 版本号数组，如：[1, 0, 0]
       * @returns {string} 版本号数组，如：1.0.0
       */
      customVersion: (VersionNameArr) => {
        console.log(VersionNameArr);
        var lastIndex = VersionNameArr.length - 1;
        VersionNameArr[lastIndex] = String(
          parseInt(VersionNameArr[lastIndex]) + 1
        );
        return VersionNameArr.join(".");
      },
    },

    /**
     * 自己处理上传逻辑：因为上传文件类型多样，所以需要自己处理
     * @param {string} filePath 文件路径
     * @param {"android"|"ios"| "appResource"| "wgt"} fileType 文件类型
     */
    async upload(filePath, fileType) {
      //上传回调
      console.log(filePath, fileType);
    },
  });
};


```


### 更新日志
[change.md](./change.md)

### 旧版本说明 
[v1版本说明](./readme_v1.md)

### Git需要忽略的文件
```
.hbuilderx/hb-cli.pack.json
.hbuilderx/hb-cli.ip.json
```

### wifi调试用到的命令参考
```
D:\办公软件\HBuilderX\plugins\launcher\tools\adbs\adb.exe tcpip 5555
D:\办公软件\HBuilderX\plugins\launcher\tools\adbs\adb.exe connect 192.168.3.2
```