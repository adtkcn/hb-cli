const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
/**
 * 上传文件
 * @param {*} uploadUrl 上传路径
 * @param {*} fileUrl 文件路径
 */
async function upload(uploadUrl, fileUrl) {
  console.log("准备上传文件");
  let formData = new FormData();
  let fileData = fs.createReadStream(fileUrl); // 根目录下需要有一个test.jpg文件
  formData.append("file", fileData);
  // let len = await new Promise((resolve, reject) => {
  //   return formData.getLength((err, length) =>
  //     err ? reject(err) : resolve(length)
  //   );
  // });
  return new Promise((resolve, reject) => {
    axios({
      url: uploadUrl,
      method: "POST",
      data: formData,
      // headers: formData.getHeaders(),
      maxContentLength: `Infinity`,
      maxBodyLength: `Infinity`,
      onUploadProgress(progressEvent) {
        //   console.log("progressEvent", progressEvent);
        if (progressEvent.lengthComputable) {
          //属性lengthComputable主要表明总共需要完成的工作量和已经完成的工作是否可以被测量
          //如果lengthComputable为false，就获取不到progressEvent.total和progressEvent.loaded
          upLoadProgress = (progressEvent.loaded / progressEvent.total) * 100; //实时获取上传进度
          console.log(
            upLoadProgress + "%",
            progressEvent.loaded,
            progressEvent.total
          );
        }
      },
    })
      .then((res) => {
        console.log("上传文件返回", res.data);
        resolve();
      })
      .catch((err) => {
        console.log("上传文件失败", err.message);
        reject(err);
      });
  });
}
// url 是图片地址
// filepath 是文件下载的本地目录
// name 是下载后的文件名
async function downloadFile(url, filepath, name) {
  console.log("准备下载文件", url);
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
  const mypath = path.join(filepath, name);
  const writer = fs.createWriteStream(mypath);

  // return Promise.resolve(
  //   "F:\\ShouGang\\app\\GasMonitoring\\unpackage\\release\\ipa\\GasMonitoring-09242334.ipa"
  // );
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log("下载完成");
      writer.end();
      resolve(mypath);
    });
    writer.on("error", () => {
      writer.end();
      console.log("下载失败");
      reject("下载失败");
    });
  });
}

// downloadFile(
//   "https://ide.dcloud.net.cn/build/download/2f6a4090-3c08-11ed-a02d-992ce364be7a",
//   "./ios/app/ipa",
//   Date.now() + ".ipa"
// );
// upload(
//   "http://127.0.0.1:1080/api/file/upload",
//  "F:\\ShouGang\\nfcManage\\NFC\\unpackage\\release\\apk\\__UNI__D8AA064__20220924174752.apk"
// );

module.exports = {
  upload,
  downloadFile,
};
