# v1.0.7
- 加入生成本地打包App资源
- 加入导出wgt包
- 自动打开App资源、wgt包的目录（ai说的能兼容mac、linux）

# v1.0.6
- 修复安卓扫码下载

# v1.0.5
- 修复说明

# v1.0.4
- 环境变量和打包配置应该区分开，单独提取出`HBuilderConfig`配置, 之前的`hb_cli.env.*.HBuilderConfig`，现改为`hb_cli.HBuilderConfig`；
- 自动上传打包后文件