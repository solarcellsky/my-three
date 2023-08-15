<template>
  <div class="three-container" id="container">
    <div class="gl" id="gl"></div>
    <!-- <div class="progress-bar" id="progressBar">
      <div class="spinner-wrap" id="spinnerWrap">
        <div class="spinner-box">
          <div class="spinner-track"></div>
          <div class="spinner"></div>
        </div>
        <div id="loadedPercent">LOADING</div>
      </div>
    </div> -->
  </div>
</template>

<script>
import * as THREE from "three";
import * as TWEEN from "tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { shader as depthVertexShader } from "./shaders/depth-vs.js";
import { shader as depthFragmentShader } from "./shaders/depth-fs.js";
import { shader as shieldVertexShader } from "./shaders/shield-vs.js";
import { shader as shieldFragmentShader } from "./shaders/shield-fs.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import Compass from "../components/common/scene/Compass";

export default {
  components: {},
  data() {
    return {
      panelExpand: true,
      infoExpand: false,
      uuid: null,
    };
  },
  mounted() {
    this.initThree();
  },
  methods: {
    initThree() {
      const container = document.getElementById("gl");
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 1, 2);
      camera.lookAt(0, 0, 0);

      const worldScene = new THREE.Scene();

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0xcaeceb);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputEncoding = THREE.LinearEncoding;
      renderer.shadowMap.enabled = true;
      renderer.sortObjects = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.gammaFactor = 2.2;

      // performance monitor
      const stats = new Stats();
      container.appendChild(renderer.domElement);
      container.appendChild(stats.dom);

      // orbit controls
      const orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      orbitControls.dampingFactor = 0.25;
      orbitControls.screenSpacePanning = true;
      orbitControls.minPolarAngle = 0;
      orbitControls.maxPolarAngle = Math.PI / 2;
      orbitControls.maxDistance = 400;
      orbitControls.minDistance = 5;
      // orbitControls.autoRotate = true;
      orbitControls.autoRotateSpeed = 0.08;
      orbitControls.target.x = 50;
      orbitControls.target.y = 0;
      orbitControls.target.z = 100;
      orbitControls.listenToKeyEvents(window);

      // lights
      const directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(50, 200, 50);
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      const directionalLightHelper = new THREE.DirectionalLightHelper(
        directionalLight,
        150,
        new THREE.Color(0xff0000)
      );
      const hemisphereLightHelper = new THREE.HemisphereLightHelper(
        hemisphereLight,
        100,
        new THREE.Color(0x202020)
      );
      const lightGroup = new THREE.Group();
      lightGroup.add(directionalLight, hemisphereLight);
      worldScene.add(lightGroup);

      const worldSceneBackground = new THREE.TextureLoader().load(
        "assets/ui/background.jpg"
      );
      worldScene.background = worldSceneBackground;
      const axesHelper = new THREE.AxesHelper(360);
      const gridHelper = new THREE.GridHelper(
        666,
        160,
        new THREE.Color(0x00ffff),
        new THREE.Color(0x202020)
      );
      const helperGroup = new THREE.Group();
      helperGroup.add(axesHelper, gridHelper);
      gridHelper.position.y = -5;
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;
      worldScene.add(helperGroup);

      const compass = new Compass({
        container: "container",
        renderer: renderer,
        scene: worldScene,
        camera: camera,
      });
      compass.create();

      const depthMaterial = new THREE.RawShaderMaterial({
        uniforms: {},
        vertexShader: depthVertexShader,
        fragmentShader: depthFragmentShader,
      });
      const depth = new THREE.WebGLRenderTarget(1, 1, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        stencilBuffer: false,
        depthBuffer: true,
      });
      const hdr = new THREE.WebGLRenderTarget(1, 1, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        stencilBuffer: false,
        depthBuffer: true,
      });
      // shield
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load("assets/images/nn.png");
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      const shieldGeometry = new THREE.SphereBufferGeometry(0.5, 100, 100);
      const shieldMaterial = new THREE.RawShaderMaterial({
        uniforms: {
          depthBuffer: { value: null },
          resolution: { value: new THREE.Vector2(1, 1) },
          bufColor: { value: null },
          u_tex: { value: null },
          time: { value: 0 },
        },
        vertexShader: shieldVertexShader,
        fragmentShader: shieldFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.set(0, 0, 0);
      shield.material.uniforms.depthBuffer.value = depth.texture;
      shield.material.uniforms.bufColor.value = depth.texture;
      shield.material.uniforms.u_tex.value = texture;
      worldScene.add(shield);

      // expose global objects
      window.camera = camera;
      window.worldScene = worldScene;
      window.renderer = renderer;
      window.stats = stats;
      window.orbitControls = orbitControls;
      window.shieldBall = shield;
      window.depthMaterial = depthMaterial;
      window.depth = depth;

      this.render();

      window.addEventListener("resize", this.onWindowResize, false);
    },
    screenPointToThreeCoords(x, y, domContainer, camera, targetZ) {
      let vec = new THREE.Vector3(); // create once and reuse
      let pos = new THREE.Vector3(); // create once and reuse
      vec.set(
        (x / domContainer.innerWidth) * 2 - 1,
        -(y / domContainer.innerHeight) * 2 + 1,
        0.5
      );
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      let distance = (targetZ - camera.position.z) / vec.z;
      pos.copy(camera.position).add(vec.multiplyScalar(distance));
      return pos;
    },
    // oldP  相机原来的位置
    // oldT  target原来的位置
    // newP  相机新的位置
    // newT  target新的位置
    // callBack  动画结束时的回调函数
    animateCamera(oldP, oldT, newP, newT, callBack) {
      const object = {
        x1: oldP.x, // 相机x
        y1: oldP.y, // 相机y
        z1: oldP.z, // 相机z
        x2: oldT.x, // 控制点的中心点x
        y2: oldT.y, // 控制点的中心点y
        z2: oldT.z, // 控制点的中心点z
      };
      orbitControls.enabled = false;
      const tween = new TWEEN.Tween(object);
      tween.to(
        {
          x1: newP.x,
          y1: newP.y,
          z1: newP.z,
          x2: newT.x,
          y2: newT.y,
          z2: newT.z,
        },
        1000
      );
      tween.onUpdate(() => {
        camera.position.x = newT.x + 6;
        camera.position.y = newT.y + 6;
        camera.position.z = newT.z + 6;
        orbitControls.target.x = object.x2 + 4;
        orbitControls.target.y = object.y2 + 4;
        orbitControls.target.z = object.z2 + 4;
        orbitControls.update();
      });
      tween.onComplete(() => {
        orbitControls.enabled = true;
        callBack && callBack();
      });
      tween.easing(TWEEN.Easing.Cubic.InOut);
      tween.start();
    },
    onProgress(xhr) {
      if (xhr.lengthComputable) {
        let percentComplete = (xhr.loaded / xhr.total) * 100;
        let lodingContainer = document.getElementById("loadedPercent");
        lodingContainer.innerHTML =
          Math.round(percentComplete, 2) + "% DOWNLOADED";
      }
    },
    onError(xhr) {
      this.makeLog("Error loading model: " + xhr, "error");
    },
    getCenterPoint(mesh) {
      const middle = new THREE.Vector3();
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox;
      middle.x = (boundingBox.max.x - boundingBox.min.x) * 0.5;
      middle.y = (boundingBox.max.y - boundingBox.min.y) * 0.5;
      middle.z = (boundingBox.max.z - boundingBox.min.z) * 0.5;
      return middle;
    },
    getCentroid(mesh) {
      mesh.geometry.computeBoundingBox();
      const boundingBox = mesh.geometry.boundingBox;

      const x0 = boundingBox.max.x;
      const x1 = boundingBox.min.x;
      const y0 = boundingBox.max.y;
      const y1 = boundingBox.min.y;
      const z0 = boundingBox.max.z;
      const z1 = boundingBox.min.z;

      const bWidth = x0 > x1 ? x0 - x1 : x1 - x0;
      const bHeight = y0 > y1 ? y0 - y1 : y1 - y0;
      const bDepth = z0 > z1 ? z0 - z1 : z1 - z0;

      const centroidX = x0 + bWidth / 2 + mesh.position.x;
      const centroidY = y0 + bHeight / 2 + mesh.position.y;
      const centroidZ = z0 + bDepth / 2 + mesh.position.z;

      return {
        x: centroidX * 0.01 - 3,
        y: centroidY * 0.01,
        z: centroidZ * 0.01 - 1,
      };
    },
    render() {
      //

      window.shieldBall.visible = false;
      window.worldScene.overrideMaterial = window.depthMaterial;
      window.renderer.setRenderTarget(window.depth);
      window.renderer.render(worldScene, camera);

      window.shieldBall.visible = true;
      window.worldScene.overrideMaterial = null;
      window.renderer.setRenderTarget(null);
      window.renderer.render(worldScene, camera);

      window.renderer.setAnimationLoop(render);
      TWEEN.update();
      window.stats.update();
      window.orbitControls.update();

      window.shieldBall.material.uniforms.time.value = performance.now();
    },
    onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererCSS.setSize(window.innerWidth, window.innerHeight);
    },
    makeLog(msg, type) {
      switch (type) {
        case "info":
          console.log(
            "%c INFO => %c" + " " + msg,
            "color: #fff; background: #41b882; padding: 3px 4px;",
            "color: #41b882; background: #fff;"
          );
          break;
        case "error":
          console.log(
            "%c ERROR => %c" + " " + msg,
            "color: #fff; background: #f56c6c; padding: 3px 4px;",
            "color: #f56c6c; background: #fff;"
          );
          break;
        default:
          console.log(
            "%c INFO => %c" + " " + msg,
            "color: #fff; background: #41b882; padding: 3px 4px;",
            "color: #41b882; background: #fff;"
          );
      }
    },
  },
};
</script>

<style lang="scss">
.three-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;

  .compass {
    position: absolute;
    top: 10px;
    right: 30px;
    width: 80px;
    height: 80px;
    opacity: 0.65;
    z-index: 9;
  }

  .gl {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .progress-bar {
    display: flex;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    transition: opacity 0.5s ease;
    align-items: center;
    justify-content: center;
    background-color: rgba(80, 80, 80, 1);

    #loadedPercent {
      color: #41b882;
      padding: 5px;
      font-size: 10px;
    }

    .spinner-wrap {
      .spinner-box {
        position: relative;
        margin: 0 auto 15px;
        width: 56px;

        .spinner-track {
          height: 56px;
          width: 56px;
          border: 6px solid #424242;
          border-radius: 50%;
        }
        .spinner {
          position: absolute;
          top: 0;
          height: 56px;
          width: 56px;
          border-radius: 50%;
          background: #ffffff;
          background: -moz-linear-gradient(
            left,
            #ffffff 10%,
            rgba(255, 255, 255, 0) 42%
          );
          background: -webkit-linear-gradient(
            left,
            #ffffff 10%,
            rgba(255, 255, 255, 0) 42%
          );
          background: -o-linear-gradient(
            left,
            #ffffff 10%,
            rgba(255, 255, 255, 0) 42%
          );
          background: -ms-linear-gradient(
            left,
            #ffffff 10%,
            rgba(255, 255, 255, 0) 42%
          );
          background: linear-gradient(
            to right,
            #ffffff 10%,
            rgba(255, 255, 255, 0) 42%
          );
          -webkit-animation: rotate 1.4s infinite linear;
          animation: rotate 1.4s infinite linear;
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);

          &:before {
            width: 50%;
            height: 50%;
            background: #ffffff;
            border-radius: 100% 0 0 0;
            position: absolute;
            top: 0;
            left: 0;
            content: "";
          }
          &:after {
            background: #505050;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            content: "";
            margin: auto;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
          }
        }
      }
    }
  }
}
.echarts {
  width: 430px;
  max-height: 100%;
  padding: 10px;
  transform: translate(-380px, 0);
  overflow: auto;
  transition: transform 0.3s ease-out;

  &.expand {
    transform: translate(0, 0);
  }

  canvas {
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  }
}
.label-wrapper {
  &.selected {
    & .label {
      background: rgba(64, 158, 255, 0.87) !important;
    }
  }

  & .label {
    position: absolute;
    right: -140px;
    top: -140px;
    width: 120px;
    background: rgba(0, 0, 0, 0.56);
    border: 1px solid rgba(0, 0, 0, 0.25);
    text-align: left;
    line-height: normal;
    padding: 10px;
    cursor: pointer;
    color: #efefef;
    transition: all 0.3s ease-out;
    border-radius: 3px 3px 3px 0;

    &::before {
      display: block;
      content: "";
      position: absolute;
      left: -12px;
      bottom: -37px;
      height: 40px;
      border-left: 1px solid rgba(0, 0, 0, 0.85);
      transform: rotate(35deg);
    }

    &.danger {
      background: rgba(245, 108, 108, 0.87);
    }

    &:hover {
      background: rgba(0, 0, 0, 0.86);
      box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.75);
    }
    & .item {
      font-size: 10px;
      display: flex;

      & .v {
        flex: 1;
        text-align: right;
      }
    }
  }
}

.info-windows {
  position: fixed;
  width: 430px;
  max-height: 100%;
  padding: 130px 10px 10px 60px;
  top: 0;
  right: -430px;
  overflow: auto;
  transition: all 0.3s ease-out;
  z-index: 10;

  .close-info-window {
    display: flex;
    position: absolute;
    top: 130px;
    left: 10px;
    overflow: hidden;
    z-index: 10000;
    background-color: rgba(255, 255, 255, 0.618);
    border-radius: 5px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    padding: 0 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    transition: left 0.2s ease-out;

    &.expand {
      left: 380px;
    }

    &:hover {
      img {
        opacity: 1;
      }
    }

    img {
      display: block;
      width: 100%;
      height: auto;
      vertical-align: middle;
      opacity: 0.5;
      transition: opacity 0.3s ease-out;
    }
  }

  & .panel {
    width: 360px;
    height: auto;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
    background: rgba(255, 255, 255, 0.75);
    text-align: left;
    margin: 0 0 10px;

    & .item {
      font-size: 12px;
      display: flex;

      & .v {
        flex: 1;
        text-align: right;
      }
    }
  }

  &.right {
    right: 0;
  }

  canvas {
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  }
}

.cam-panel-container {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

@-webkit-keyframes rotate {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes rotate {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes open_drawer {
  to {
    -webkit-transform: translateX(-300px);
    -transform: translateX(-380px);
  }
}

@-webkit-keyframes open_drawer {
  to {
    -webkit-transform: translateX(-300px);
    -transform: translateX(-380px);
  }
}
</style>
