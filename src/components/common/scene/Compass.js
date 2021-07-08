import * as THREE from "three";

export default class Compass {
  constructor(options) {
    this.options = options;
  }
  create() {
    let self = this;

    const dom = document.getElementById(this.options.container);
    const ele = document.createElement('img');
    ele.setAttribute('class', 'compass');
    ele.setAttribute('id', 'compass');
    ele.setAttribute('src', 'assets/compass.svg');

    dom.appendChild(ele);

    const dir = new THREE.Vector3();
    const sph = new THREE.Spherical();
    const compass = ele;

    this.options.renderer.setAnimationLoop(() => {
      this.options.renderer.render(this.options.scene, this.options.camera);
      this.options.camera.getWorldDirection(dir);
      sph.setFromVector3(dir);
      compass.style.transform = `rotate(${THREE.Math.radToDeg(sph.theta) - 180}deg)`;
    });
  }
}
