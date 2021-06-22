<template>
  <div id="container"></div>
  <div id="progress-bar"></div>
</template>

<script lang="ts">
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { InteractionManager  } from './three.interactive.module.js';

const stats = new Stats();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

const directionalLight = new THREE.DirectionalLight(0xdfebff);
const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 5 );
const hemisphereLight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight, 5 );

const orbitControls = new OrbitControls( camera, renderer.domElement );

// // Instantiate a loader
const dracoLoader = new DRACOLoader();
const loader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

export default {
  name: "Home",
  components: {},
  methods: {
    async init() {
      let self = this;
      camera.position.set( 10, 10, 10 );
      camera.lookAt( 0, 0, 0 );
      
      scene.add(new THREE.AxesHelper(5));
      
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize( window.innerWidth, window.innerHeight );

      const container = document.getElementById('container');
      container.appendChild( renderer.domElement );
      container.appendChild( stats.dom );
      
      scene.add(directionalLight);
      scene.add(directionalLightHelper);

      scene.add( hemisphereLight );
      scene.add( hemisphereLightHelper );

      scene.background = new THREE.TextureLoader().load("assets/texture/sky/sky.jpg");


      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const loadingManager = new THREE.LoadingManager();
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        loadingManager.onProgress = function (item, loaded, total) {
          console.log((loaded / total) * 100 + '%')
          progressBar.style.width = (loaded / total) * 100 + '%';
        };

        loadingManager.onLoad = function () {
          progressBar.style.width = '100%';
          setTimeout(() => {
            progressBar.style.display = 'none';
          }, 500);
        };
      }

      const rgbeLoader = new RGBELoader();
      rgbeLoader
        .setDataType(THREE.UnsignedByteType)
        .load('assets/texture/skybox_512px.hdr', (texture) => {
          let envMap = pmremGenerator.fromEquirectangular(texture).texture;
          scene.environment = envMap;
          texture.dispose();
        });

      rgbeLoader.manager = loadingManager;

      // controls
      orbitControls.listenToKeyEvents( window ); // optional

      // Specify path to a folder containing WASM/JS decoding libraries.
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });

      // Optional: Pre-fetch Draco WASM/JS module.
      dracoLoader.preload();

      
      loader.setDRACOLoader(dracoLoader);
      loader.manager = loadingManager;

      loader.load( 'assets/rtt_building/scene.gltf', function (gltf) {
        gltf.scene.name = 'Rtt Building'; //标识模型
        const _scene = gltf.scene;
        let bbox = new THREE.Box3().setFromObject(_scene);
        let cent = bbox.getCenter(new THREE.Vector3());
        let size = bbox.getSize(new THREE.Vector3());

        //Rescale the object to normalized space
        let maxAxis = Math.max(size.x, size.y, size.z);
        _scene.scale.multiplyScalar(2.0 / maxAxis);
        bbox.setFromObject(_scene);
        bbox.getCenter(cent);
        bbox.getSize(size);
        //Reposition to 0,halfY,0
        _scene.position.copy(cent).multiplyScalar(-1);
        _scene.position.y-= (size.y * 0.1);

        scene.add(_scene);
        self.bindSceneEvent(_scene);
        
      }, this.onProgress, this.onError);
      
      this.animate();
    },
    bindSceneEvent(scene) {
      let objectsHover = [];
      const logDiv = document.createElement('div');
      logDiv.setAttribute('style', 'position: absolute;bottom:0;right:0;width: 360px;background: rgba(0, 0, 0, .6);color:#00f3f7;padding: 5px;font-size:10px;');
      logDiv.innerText = 'Model Infos Here';
      container.appendChild(logDiv);

      scene.traverse((child) => {
        if (child.children.length === 0) {
          // Add only objects widthout children
          if (child.material) {
            child.material = child.material.clone();
            child.userData.initialEmissive = child.material.emissive.clone();
            child.material.emissiveIntensity = 0.5;
          }

          interactionManager.add(child);

          child.addEventListener('mouseover', (event) => {
            if (!objectsHover.includes(event.target))
              objectsHover.push(event.target);

            document.body.style.cursor = 'pointer';

            const path = this.getPath(event.target);
            logDiv.innerText = path;

            if (child.material) {
              child.userData.materialEmissiveHex = child.material.emissive.getHex();
              child.material.emissive.setHex(0xff0000);
              child.material.emissiveIntensity = 0.5;
            }
          });

          child.addEventListener('mouseout', (event) => {
            objectsHover = objectsHover.filter((n) => n !== event.target);
            if (objectsHover.length > 0) {
              const o = objectsHover[objectsHover.length - 1];
              o.material.emissive.setHex(0xff0000);
              logDiv.innerText = this.getPath(o);
            } else {
              logDiv.innerHTML = 'Null';
            }

            document.body.style.cursor = 'default';

            if (child.material) {
              child.material.emissive.setHex(
                child.userData.materialEmissiveHex
              );
            }
          });

          child.addEventListener('mousedown', (event) => {
            event.stopPropagation();

            if (child.material) {
              child.material.emissive.setHex(0x0000ff);
            }

            const path = this.getPath(event.target);
            logDiv.innerText = path;
          });
        }
      })
    },
    animate() {
      requestAnimationFrame(this.animate);
      renderer.render(scene, camera);
      interactionManager.update();
      stats.update();
    },
    onProgress(xhr) {
      if ( xhr.lengthComputable ) {
        let percentComplete = xhr.loaded / xhr.total * 100;
        let lodingContainer = document.createElement('div');
        lodingContainer.setAttribute('style', 'position: absolute;bottom:0;left:0;background: rgba(0, 0, 0, .6);color:#00f3f7;padding: 5px;font-size:10px;');
        lodingContainer.innerHTML = Math.round(percentComplete, 2) + '% downloaded';
        container.appendChild(lodingContainer);
      }
    },
    onError(xhr) {
      console.log('err', xhr)
    },
    getPath(object) {
      const string = object.name + ' [' + object.type + ']';

      if (object.parent) {
        return this.getPath(object.parent) + ' > ' + string;
      } else {
        return string;
      }
    }
  },
  mounted() {
    this.init();
  },
};
</script>

<style scoped>
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
</style>