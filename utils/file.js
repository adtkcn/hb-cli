// const axios = require("axios");
// const FormData = require("form-data");
const fs = require("fs");
const path = require("path"); 

/**
 * 上传文件
 * @param {*} uploadUrl 上传路径
 * @param {*} fileUrl 文件路径
 * @param {*} data post的数据
 */
// async function upload(uploadUrl, fileUrl, data) {
//   console.log("准备上传文件");
//   let formData = new FormData();
//   let fileData = fs.createReadStream(fileUrl); // 根目录下需要有一个test.jpg文件

//   if (data && typeof data == "object") {
//     for (const key in data) {
//       if (Object.hasOwnProperty.call(data, key)) {
//         const val = data[key];
//         formData.append(key, val);
//       }
//     }
//   }
//   formData.append("file", fileData);
 
//   return new Promise((resolve, reject) => {
//     axios({
//       url: uploadUrl,
//       method: "POST",
//       data: formData,
//       // headers: formData.getHeaders(),
//       maxContentLength: `Infinity`,
//       maxBodyLength: `Infinity`,
//       onUploadProgress(progressEvent) {
//         //   console.log("progressEvent", progressEvent);
//         if (progressEvent.lengthComputable) {
//           //属性lengthComputable主要表明总共需要完成的工作量和已经完成的工作是否可以被测量
//           //如果lengthComputable为false，就获取不到progressEvent.total和progressEvent.loaded
//           let upLoadProgress = (progressEvent.loaded / progressEvent.total) * 100; //实时获取上传进度
//           console.log(
//             upLoadProgress + "%",
//             progressEvent.loaded,
//             progressEvent.total
//           );
//         }
//       },
//     })
//       .then((res) => {
//         console.log("上传文件返回", res.data);
//         resolve();
//       })
//       .catch((err) => {
//         console.log("上传文件失败", err.message);
//         reject(err);
//       });
//   });
// } 

/**
 * 
 * @param {string} url app资源地址
 * @param {string} filepath 文件下载的本地目录
 * @param {string} name 文件名称
 * @returns 本地文件路径名称
 */
async function downloadFile(url, filepath, name) {
  console.log("准备下载文件", url);
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
  const savePath = path.join(filepath, name);


  // 替换axios实现
  const http = url.startsWith('https') ? require('https') : require('http');
  
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`服务器返回异常状态码: ${response.statusCode}`);
        return;
      }
      const writer = fs.createWriteStream(savePath);
      response.pipe(writer);
      
      writer.on('finish', () => {
        console.log("下载完成");
        writer.end();
        resolve(savePath);
      });

      writer.on('error', (err) => {
        writer.end();
        console.log("下载失败");
        reject(err);
      });
    }).on('error', (err) => {
      console.log("请求失败");
      reject(err);
    });
  });
}

// downloadFile(
//   "https://ide.dcloud.net.cn/build/download/2f6a4090-3c08-11ed-a02d-992ce364be7a",
//   "./ios/app/ipa",
//   Date.now() + ".ipa"
// );
// downloadFile(
//   "http://img.ithome.com/newsuploadfiles/2025/4/6da8713f-35a8-476e-826c-c6951cdaf3a3.png?x-bce-process=image/format,f_avif",
//   "./.hbuilderx",
//   Date.now() + ".png"
// );

// upload(
//   "http://127.0.0.1:1080/api/file/upload",
//  "F:\\ShouGang\\nfcManage\\NFC\\unpackage\\release\\apk\\__UNI__D8AA064__20220924174752.apk"
// );

module.exports = {
  // upload,
  downloadFile,
};
