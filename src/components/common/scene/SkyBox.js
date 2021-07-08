import * as THREE from 'three';


export default class SkyBox {
  constructor(urls, scene) {
    this.urls = urls;
    this.scene = scene;
  }
  create() {
    const urls = this.urls;
    const skyboxCubeMap = new THREE.CubeTextureLoader().load(urls)
    this.scene.background = skyboxCubeMap
  }
}
