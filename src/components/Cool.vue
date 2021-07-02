<template>
  <div id="container"></div>
  <div id="progress-bar"></div>
  <Slider />
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// import { JSONLoader } from 'three/examples/jsm/loaders/JSONLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import Slider from '../components/common/ui/Slider'

export default {
  name: "Cool",
  components: {
    Slider
  },
  data() {
    return {
      models: [
        { name: 'assets/z.glb', position: { x: 0, y: 0, z: 0 } }
      ]
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.initLoadingManager();
      this.initScene();
      this.initCameras();
      this.initRenderer();
      this.initHelpers();
      this.initControls();
      this.animate();
    },
    initScene() {
      const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 300 );
      const worldScene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

      const labelRenderer = new CSS2DRenderer();

      window.camera = camera;
      window.worldScene = worldScene;
      window.renderer = renderer;
      window.labelRenderer = labelRenderer;

      window.addEventListener('resize', this.onWindowResize, false);
    },
    initRenderer() {
      const stats = new Stats();
      window.stats = stats;
      const container = document.getElementById('container');
      container.appendChild( window.renderer.domElement );
      container.appendChild( stats.dom );

      window.renderer.setClearColor(0x000000);
      window.renderer.setPixelRatio(window.devicePixelRatio);
      window.renderer.setSize( window.innerWidth, window.innerHeight );
      window.renderer.outputEncoding = THREE.LinearEncoding;
      window.renderer.shadowMap.enabled = true;
      window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      window.labelRenderer.setSize( window.innerWidth / 2, window.innerHeight );
      window.labelRenderer.domElement.style.position = 'absolute';
      window.labelRenderer.domElement.style.top = '0px';
      window.document.body.appendChild( labelRenderer.domElement );
    },
    initCameras() {
      window.camera.position.set( -5, 21.5, -42 );
      window.camera.lookAt( 0, 0, 0 );
    },
    initHelpers() {
      const directionalLight = new THREE.DirectionalLight(0xdfebff);
      const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 5 );
      const hemisphereLight = new THREE.HemisphereLight( 0xffff00, 0x080820, 1 );
      const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight, 5 );
      const spotLight = new THREE.SpotLight( 0xff0000);
      const spotLightHelper = new THREE.SpotLightHelper( spotLight, 5 );
      const axesHelper = new THREE.AxesHelper(5);

      worldScene.background = new THREE.TextureLoader().load("assets/texture/galaxy.jpg");

      const geometry = new THREE.SphereGeometry( 100, 100, 100 );
      const wireframe = new THREE.WireframeGeometry( geometry );
      const line = new THREE.LineSegments( wireframe );
      line.material.depthTest = false;
      line.material.opacity = 0.3;
      line.material.transparent = true;
      worldScene.add(line);

      const gridHelper = new THREE.GridHelper(600, 160, new THREE.Color(0xf56c6c), new THREE.Color(0xececec))
      gridHelper.position.y = -5;
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;

      const helperGroup = new THREE.Group();
      const lightGroup = new THREE.Group();
      helperGroup.add(axesHelper, directionalLightHelper, hemisphereLightHelper, gridHelper, spotLightHelper);
      lightGroup.add(directionalLight, hemisphereLight, spotLight);

      worldScene.add(helperGroup);
      worldScene.add(lightGroup);
    },
    initControls() {
      const orbitControls = new OrbitControls( window.camera, window.renderer.domElement );
      orbitControls.scaleFactor = 0.04;
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControls.enableZoom = true;
      orbitControls.zoomSpeed = 0.2;
      orbitControls.enablePan = false;
      orbitControls.autoRotate = true;
      orbitControls.autoRotateSpeed = 0.008;
      orbitControls.maxPolarAngle = 1.1;
      orbitControls.minPolarAngle = 0.7;
      orbitControls.enableKeys = false;
      orbitControls.minDistance = 22;
      orbitControls.maxDistance = 70;
      // controls
      orbitControls.listenToKeyEvents( window );

    },
    initLoadingManager() {
      const loadingManager = new THREE.LoadingManager();
      window.loadingManager = loadingManager;
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        loadingManager.onProgress = function (item, loaded, total) {
          progressBar.style.width = (loaded / total) * 100 + '%';
        };

        loadingManager.onLoad = function () {
          console.log(666)
          progressBar.style.width = '100%';
          setTimeout(() => {
            progressBar.style.display = 'none';
          }, 500);
        };
      }
    },
    setOpacity(val) {
      console.log(val)
    },
    animate() {
      requestAnimationFrame(this.animate);
      window.renderer.render(window.worldScene, window.camera);
      window.labelRenderer.render(window.worldScene, window.camera);
      window.stats.update();
    },
    onWindowResize(){
      window.camera.aspect = window.innerWidth / window.innerHeight;
      window.camera.updateProjectionMatrix();

      window.renderer.setSize(window.innerWidth, window.innerHeight);

    }
  },
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
}
#progress-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background: #00f3f7;
  z-index: 9;
  transition: all 0.5s ease;
}
#log-panel {
  position: absolute;
  bottom:0;
  right:0;
  width: 360px;
  background: rgba(0, 0, 0, .6);
  color:#00f3f7;
  padding: 5px;
  font-size:10px;
}
</style>