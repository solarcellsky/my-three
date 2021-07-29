import * as THREE from "three";

export default class ArrowFlow {
  constructor(options, scene) {
    this.options = options;
    this.scene = scene;
  }
  create() {
    let curveArr = []
    const path = this.options.path
    const radius = this.options.radius
    // 三个一组取出curve数据
    for (let i = 0; i < path.length; i += 3) {
      curveArr.push(new THREE.Vector3(path[i], path[i+1], path[i+2]))
    }
    const curve = new THREE.CatmullRomCurve3(curveArr);
    /**
      * TubeGeometry(path : Curve, tubularSegments : Integer, radius : Float, radialSegments : Integer, closed : Boolean)
    */
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, radius, 8, false);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.options.left ? 'assets/texture/arrow.png' : 'assets/texture/arrow0.png');

    // 设置阵列模式 RepeatWrapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // 设置x方向的重复数(沿着管道路径方向)
    // 设置y方向的重复数(环绕管道方向)
    texture.repeat.x = this.options.repeatX;
    texture.repeat.y = this.options.repeatY;
    // 设置管道纹理偏移数,便于对中
    texture.offset.y = 0.5;
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffffff),
      map: texture,
      side: THREE.FrontSide,
      transparent: true,
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    // 使用加减法可以设置不同的运动方向
    setInterval(() => {
      this.options.left ? texture.offset.x += 0.0076 : texture.offset.x -= 0.0076
    })
    this.scene.add(tube)
  }
}
