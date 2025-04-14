const http = require("http");
const fs = require("fs");
const path = require("path");

const config = require("../config/config.js");
const utils = require("../utils/utils.js");

var apkPath = "";

// 静态文件服务中间件
function staticServe(rootPath) {
  return function (req, res) {
    let pathname = path.join(rootPath, "static", req.url);

    fs.stat(pathname, (err, stats) => {
      if (err) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      if (stats.isDirectory()) {
        pathname = path.join(pathname, "index.html");
      }

      fs.readFile(pathname, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end("Not Found");
        } else {
          // 简单设置Content-Type
          const ext = path.extname(pathname);
          const mimeTypes = {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpg",
            ".gif": "image/gif",
            ".ico": "image/x-icon",
          };

          res.setHeader(
            "Content-Type",
            mimeTypes[ext] || "application/octet-stream"
          );
          res.end(data);
        }
      });
    });
  };
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  console.log("请求路径", req.url);

  const pathname = req.url;
  // 禁用缓存
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  // 路由处理
  if (pathname === "/download") {
    try {
      const filePath = path.resolve(apkPath);
      const basename = path.basename(filePath);

      res.setHeader("Content-disposition", `attachment;filename=${basename}`);
      fs.createReadStream(filePath)
        .on("error", () => {
          res.statusCode = 404;
          res.end("Not Found");
        })
        .pipe(res);
    } catch (error) {
      console.log(error);
      res.statusCode = 500;
      res.end("文件下载失败");
    }
  } else if (pathname === "/open") {
    try {
      utils.openDirectory(apkPath);

      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          code: 1,
          msg: "win没问题，mac、linux不知道",
        })
      );
    } catch (error) {
      console.log(error);
      res.statusCode = 500;
      res.end("操作失败");
    }
  } else {
    // 静态文件服务
    staticServe(__dirname)(req, res);
  }
});

// 导出接口
exports.init = function (filePath) {
  apkPath = filePath;
  server.listen(config.port, () => {
    console.log("listening on port " + config.port);
  });

  let url = `http://${utils.getLocalIP()}:${config.port}`;

  utils.openDefaultBrowser(url);
};

exports.exit = function () {
  process.exit(0);
};
