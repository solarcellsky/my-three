

let express = require('express');
let router = express.Router();

var multer = require('multer')
var formidable = require('formidable');

var fs = require('fs')
var path = require('path')


/* GET home page. */
router.get('/', function (req, res, next) {
  res.send({
    success: "我的"
  })
});


//上传的文件保存在upload文件里面
router.post('/file/upload', function (req, res) {
  const form = formidable({multiples: true});
  //设置保存文件的本地地址
  form.uploadDir = "upload";
  form.keepExtensions = true;//保存扩展名
  //form.maxFieldsSize = 20 * 1024 * 1024;//上传文件的最大大小
  form.parse(req, (err, fields, files) => {
    let fileName = ''
    //切割上传文件的路径
    let list = files.file.name.split('/')

    //如果是上传的文件夹,需要遍历进行创建文件夹
    for (let i = 0; i < list.length - 1; i++) {
      fileName = fileName + list[i] + '/'
    }
    //   //创建文件夹
    fs.mkdirSync(form.uploadDir + '/' + fileName, {recursive: true})

    // //复制文件到上传文件夹路径
    fs.rename(files.file.path, form.uploadDir + '/' + files.file.name, function (err) {
      if (err) throw err;
      console.log('重命名完成');
    })

    if (err) {
      next(err);
      return;
    }
    res.json({fields, files});
  });

})

//获取当前所有文件与文件夹
router.post('/file/uploadPath', (req, res, next) => {
  getFileAll(req, res, next)
})






//组装upload文件夹下所以文件
function getFileAll(req, res, next) {
  let basePath = 'http://192.168.3.93:8080/#/Main/file'
  fs.readdir(req.body.url, function (err, files) {
    if (err) {
      console.log("未找到文件")
    } else {
      let fileList = [];//文件
      let DirList = [];//文件夹
      (function iterator(i) {
        if (i === files.length) {
          let data = {
            fileList,
            DirList,
            url: basePath
          }
          res.json(data)
          //console.log(data)
          return
        }
        var filedir = path.join(req.body.url, files[i]);
        fs.stat(filedir, function (err, stats) {
          //console.log(stats)
          if (err) {
            console.log("出错了")
            return
          }
          var isFile = stats.isFile();//是文件
          var isDir = stats.isDirectory();//是文件夹
          if (isDir) {
            DirList.push({
              name: files[i],
              size: stats.size,
              mtime: stats.mtime
            })
          }
          if (isFile) {
            fileList.push({
              name: files[i],
              size: stats.size,
              mtime: stats.mtime
            })
          }
          iterator(i + 1)
        })
      })(0)
    }
  })
}

module.exports=router
