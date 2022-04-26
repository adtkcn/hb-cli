<!-- dotenv -->

# 全局安装

```
npm i -g @adtkcn/hb-cli
```

# 运行

1. 全局安装 @adtkcn/hb-cli
2. 在项目下创建 HBuilderConfig.json
3. 在项目下运行命令

```bash
hb-cli
```

# HBuilderConfig.json，内容如下:

https://hx.dcloud.net.cn/cli/pack?id=config

<!-- 除了"hb-cli"都是官方配置 -->

```json5
{
  //项目名字或项目绝对路径
  project: "",
  //打包平台 默认值android  值有"android","ios" 如果要打多个逗号隔开打包平台
  platform: "android,ios",
  //是否使用自定义基座 默认值false  true自定义基座 false自定义证书
  iscustom: false,
  //打包方式是否为安心打包默认值false,true安心打包,false传统打包
  safemode: true,
  //android打包参数
  android: {
    //安卓包名
    packagename: "",
    //安卓打包类型 默认值0 0 使用自有证书 1 使用公共证书 2 使用老版证书 3 在线证书
    androidpacktype: "3",
    //安卓使用自有证书自有打包证书参数
    //安卓打包证书别名,自有证书打包填写的参数
    certalias: "",
    //安卓打包证书文件路径,自有证书打包填写的参数,  -------------相对路径(官方本身配置需要绝对路径,我考虑到切换电脑不方便,改为相对路径)-----
    certfile: "",
    //安卓打包证书密码,自有证书打包填写的参数
    certpassword: "",
    //安卓平台要打的渠道包 取值有"google","yyb","360","huawei","xiaomi","oppo","vivo"，如果要打多个逗号隔开
    channels: "",
  },
  //ios打包参数
  ios: {
    //ios appid
    bundle: "uni.UNID8AA064",
    //ios打包支持的设备类型 默认值iPhone 值有"iPhone","iPad" 如果要打多个逗号隔开打包平台
    supporteddevice: "iPhone,iPad",
    //iOS打包是否打越狱包,只有值为true时打越狱包,false打正式包
    isprisonbreak: false,
    //iOS使用自定义证书打包的profile文件路径
    profile: "", //-------------相对路径(官方本身配置需要绝对路径,我考虑到切换电脑不方便,改为相对路径)-----
    //iOS使用自定义证书打包的p12文件路径
    certfile: "", //-------------相对路径(官方本身配置需要绝对路径,我考虑到切换电脑不方便,改为相对路径)-----
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

  // "hb-cli": {}
}
```
