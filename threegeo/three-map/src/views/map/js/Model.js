export default class Model {
  constructor(scene, fileUrl) {
    this.fileUrl = fileUrl;
    this.scene = scene;
  }

  /**
   * 导入外部模型后创建为新的一个group
   */
  loadModel() {


  }

  /**
   * 导入外部字体
   */
  // loadFont() {
  //   const that = this;
  //   new THREE.FontLoader().load(this.fileUrl + '/gltfl/fbx/text/FZXingHeiS-R-GB_Regular.json', function (font) {
  //     that.fontObject = font;
  //     console.log(font)
  //     that.fontJudge[0] = true
  //   });
  // }
}

