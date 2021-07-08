import * as THREE from "three";

export default class SceneArea {
  constructor(options) {
    this.options = options;
  }
  //region 矩形区域
  createPlane() {
    const LineMat = new THREE.MeshBasicMaterial({color: new THREE.Color(0xffff00), opacity: 1});
    const geometry = new THREE.PlaneGeometry(
      this.options.lineWidth,
      this.options.length
    );
    var obj = new THREE.Mesh(geometry, LineMat);
    obj.position.set(this.options.x, 0, this.options.z);
    obj.rotation.x = -Math.PI / 2.0;
    var obj2 = obj.clone();
    obj2.translateX(this.options.width);

    var geometry2 = new THREE.PlaneGeometry(
      this.options.lineWidth,
      this.options.width
    );
    var obj3 = new THREE.Mesh(geometry2, LineMat);
    obj3.position.set(
      this.options.x + this.options.width / 2,
      0,
      this.options.z - this.options.length / 2 + this.options.lineWidth / 2
    );
    obj3.rotation.x = -Math.PI / 2.0;
    obj3.rotation.z = -Math.PI / 2.0;
    var obj4 = obj3.clone();
    obj4.translateX(this.options.length - this.options.lineWidth);

    var group = new THREE.Group();
    group.add(obj, obj2, obj3, obj4);
    group.translateX(-this.options.width / 2);
    this.options.scene.add(group);
  }
  //endregion

  //region 库区
  /** 放置虚线框区域和库区名称 */
  create() {
    let self = this;
    this.createPlane(
      this.options.x,
      this.options.z,
      this.options.width,
      this.options.length,
      this.options.scene
    );
    const fontLoader = new THREE.FontLoader();

    fontLoader.load("assets/fonts/FZYaoTi_Regular.json", function (font) {
      ////加入立体文字
      const text = new THREE.TextGeometry(self.options.name.split("$")[1], {
        // 设定文字字体
        font: font,
        //尺寸
        size: self.options.fontSize,
        //厚度
        height: 0.01,
      });
      text.computeBoundingBox();
      //3D文字材质
      const m = new THREE.MeshStandardMaterial({color: new THREE.Color(self.options.textColor)});
      var mesh = new THREE.Mesh(text, m);
      if (self.options.textPosition == "左对齐") {
        mesh.position.x = self.options.x - self.options.width / 2;
        mesh.position.z = self.options.x + self.options.length / 2 - 3;
      } else if (self.options.textPosition == "居中") {
        mesh.position.x = self.options.x;
        mesh.position.z = 0;
      } else if (self.options.textPosition == "右对齐") {
        mesh.position.x = self.options.x - self.options.width / 2;
        mesh.position.z = - self.options.width / 2 + 4;
      }
      mesh.position.y = 0;
      // mesh.position.z = self.options.z + self.options.length / 2 - 20;
      mesh.rotation.x = -Math.PI / 2.0;
      self.options.scene.add(mesh);
    });
  }
}
