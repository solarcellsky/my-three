<template>
  <div id="babylon-canvas"></div>
</template>
<script>
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

const canvas = document.createElement("canvas");
      canvas.setAttribute('id', 'renderCanvas');
      canvas.setAttribute('height', window.innerHeight);
      canvas.setAttribute('width', window.innerWidth);

let engine = null;
let scene = null;
let sceneToRender = null;

export default {
  name: 'Baby',
  mounted() {
    this.initFunction();
  },
  methods: {
    createDefaultEngine() {
      return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
    },

    async initFunction () {
      const dom = document.getElementById('babylon-canvas');
            dom.appendChild(canvas);
            dom.style.width = window.innerWidth;
            dom.style.height = window.innerHeight;

      engine = this.createDefaultEngine();
      if (!engine) throw 'engine should not be null.';
      window.scene = this.createScene();

      sceneToRender = window.scene
      engine.runRenderLoop(() => {
        if (sceneToRender && sceneToRender.activeCamera) {
          sceneToRender.render();
        }
      });

      window.addEventListener("resize", function () {
        dom.style.width = window.innerWidth;
        dom.style.height = window.innerHeight;
        canvas.setAttribute('height', window.innerHeight);
        canvas.setAttribute('width', window.innerWidth);
        engine.resize();
      });
    },
    createScene() {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(.792, .926, .923, 1);

        const camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 4, 350, new BABYLON.Vector3(0, 0, 0), scene);

         // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        camera.easing = new BABYLON.CubicEase;
        camera.duration = 60;
        camera.minZ = 4;
        camera.maxZ = 3e3;
        camera.panningAxis = new BABYLON.Vector3(1, 0, 1);
        camera.panningSensibility = 40;
        camera.panningOriginTarget = new BABYLON.Vector3(-270, 0, -430);
        camera.panningDistanceLimit = 500;
        camera.wheelPrecision = 10;
        camera.allowUpsideDown = !1;
        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 400;
        camera.lowerBetaLimit = .5;
        camera.upperBetaLimit = Math.PI - .5;
        camera.checkCollisions = !0;
        camera.collisionRadius = new BABYLON.Vector3(3, 3, 3);
        camera.easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        camera.useAutoRotationBehavior = true;
        camera.autoRotationBehavior.idleRotationSpeed = 1; //自动旋转速度
        camera.autoRotationBehavior.idleRotationWaitTime = 1000; //用户交互后多少时间开启自动旋转（毫秒）
        camera.autoRotationBehavior.idleRotationSpinupTime = 1000; //从开始自动旋转到设置的旋转速度所需要的时间（毫秒）
        camera.autoRotationBehavior.zoomStopsAnimation = true; //设置缩放是否会停止自动旋转

        const _t = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/campusalbano/environment.env", scene);
        // scene.environmentBRDFTexture = _t;
        console.log(_t, scene)

        // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));

        // const ground = BABYLON.Mesh.CreateGround("Ground", 3e3, 3e3, 16, scene);

        // const box = BABYLON.MeshBuilder.CreateBox("box", {});

        BABYLON.SceneLoader.Append("assets/campusalbano/", "environment.glb", scene, function (scene) {
          // Create a default arc rotate camera and light.
          scene.createDefaultCameraOrLight(true, true, true);
  
          // The default camera looks at the back of the asset.
          // Rotate the camera by 180 degrees to the front of the asset.
          scene.activeCamera.alpha += Math.PI;
        });

        BABYLON.SceneLoader.Append("assets/campusalbano/", "buildings.glb", scene, function (scene) {
          // Create a default arc rotate camera and light.
          scene.createDefaultCameraOrLight(true, true, true);
  
          // The default camera looks at the back of the asset.
          // Rotate the camera by 180 degrees to the front of the asset.
          scene.activeCamera.alpha += Math.PI;
        });

        const dome = new BABYLON.PhotoDome("skybox","assets/campusalbano/skybox.jpg",{
          resolution: 64,
          size: 4e3,
          useDirectMapping: true
        }, scene).position.set(-300, 0, -400)

        return scene;
    },
  }
};
</script>
<style lang="scss">
#babylon-canvas {
  width: 100%;
  height: 100%;
}
</style>