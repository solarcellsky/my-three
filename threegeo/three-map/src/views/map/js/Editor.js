import Scene from './Scene'
import Model from './Model'

export default class Editor {
  constructor(container,url) {
    //模型url地址
    // this.fileUrl = "http://10.10.0.99:8000/api/file/getFile/";
    this.fileUrl = url;
    this.scene = new Scene(container)
    this.model = new Model(this.scene.scene,this.fileUrl);
  }
}
