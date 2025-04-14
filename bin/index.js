#!/usr/bin/env node

const { prompt } = require("./prompt.js");
const package = require("../package.json");

const { Command } = require("commander");
const program = new Command();

program
  .version(package.version, "-v, --version", "输出当前版本")
  .description("uniapp打包工具")
  .option("-m, --mode <mode>", "指定mode模式")
  // .option("-d, --debug [debug]", "指定debug模式", false)
  .action((options) => {
    prompt(options);
  });

program.parse();