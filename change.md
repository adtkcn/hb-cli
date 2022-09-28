# v1.0.4
- 环境变量和打包配置应该区分开，单独提取出`HBuilderConfig`配置, 之前的`hb_cli.env.*.HBuilderConfig`，现改为`hb_cli.HBuilderConfig`；
- 自动上传打包后文件