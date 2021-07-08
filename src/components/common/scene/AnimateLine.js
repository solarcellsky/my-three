import * as THREE from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils.js';

export default class AnimateLine {
  constructor(options, scene) {
    this.options = options;
    this.scene = scene;
  }
  create() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.options.left ? 'assets/texture/exit.png' : 'assets/texture/exit0.png');
    // 设置阵列模式 RepeatWrapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // 设置x方向的重复数(沿着管道路径方向)
    // 设置y方向的重复数(环绕管道方向)
    texture.repeat.x = this.options.repeatX;
    texture.repeat.y = this.options.repeatY;
    // 设置管道纹理偏移数,便于对中
    texture.offset.y = 0;

    const planeGeometry = new THREE.PlaneGeometry(10, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const line = new THREE.Mesh(planeGeometry, material);

    setInterval(() => {
      this.options.left ? texture.offset.x += 0.0076 : texture.offset.x -= 0.0076
    })

    this.scene.add(line)
  }
}
