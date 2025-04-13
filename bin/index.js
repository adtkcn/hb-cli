#!/usr/bin/env node

const { prompt } = require("./prompt.js");
const package = require("../package.json");

const { Command } = require("commander");
const program = new Command();

program
  .version(package.version, "-v, --version", "输出当前版本")
  .description("uniapp打包工具")
  // .option("-p, --pack <pack>", "指定pack模式")
  .option("-m, --mode <mode>", "指定mode模式")
  .action((options) => {
    console.log(options);
    prompt(options);
  });

program.parse();

// const options = program.opts();
// console.log(options);
