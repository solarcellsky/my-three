<template>
  <div id="container"></div>
  <div id="progress-bar"></div>
  <div id="log-panel"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { InteractionManager  } from './three.interactive.module.js';

const stats = new Stats();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
const worldScene = new THREE.Scene();

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

const loadingManager = new THREE.LoadingManager();
const clock = new THREE.Clock();

let mixers = [];

export default {
  name: "HelloWorld",
  components: {},
  mounted() {
    this.initScene();
    this.initRenderer();
    this.animate();
  },
  methods: {
    initScene() {
      camera.position.set( 10, 10, 10 );
      camera.lookAt( 0, 1, 0 );
      
      orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      orbitControls.dampingFactor = 0.05;
      orbitControls.screenSpacePanning = false;
      orbitControls.maxPolarAngle = Math.PI / 2;
      
      worldScene.add(new THREE.AxesHelper(5));
      worldScene.add(directionalLight);
      worldScene.add(directionalLightHelper);
      worldScene.add( hemisphereLight );
      worldScene.add( hemisphereLightHelper );
      // worldScene.background = new THREE.TextureLoader().load("assets/texture/galaxy.jpg");

      const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshPhongMaterial({
          color: 0x000000,
          depthWrite: false
        })
      );

      groundMesh.rotation.x = - Math.PI / 2;
      groundMesh.receiveShadow = false;
      worldScene.add( groundMesh );

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        loadingManager.onProgress = function (item, loaded, total) {
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
          worldScene.environment = envMap;
          texture.dispose();
        });

      rgbeLoader.manager = loadingManager;

      // controls
      orbitControls.listenToKeyEvents( window ); // optional

      const MODELS = [
        { name: 'assets/mybuildings/trees/scene.gltf', position: { x: 0, y: 0, z: 0 } },
        { name: 'assets/mybuildings/trees/scene.gltf', position: { x: 0, y: 0, z: 1 } },
        { name: 'assets/mybuildings/trees/scene.gltf', position: { x: 0, y: 0, z: 2 } },
        { name: 'assets/mybuildings/garden/scene.gltf', position: { x: 2.5, y: 2.8, z: 0 }, scale: 10.0, rotation: -8.29 },
        { name: 'assets/mybuildings/house/scene.gltf', position: { x: 0, y: 0, z: 1.5 } , scale: 4.0},
        { name: 'assets/mybuildings/house/scene.gltf', position: { x: 0, y: 0, z: -4.5 } , scale: 4.0},
      ];
      this.loadModels(MODELS);
      
      window.addEventListener( 'resize', this.onWindowResize, false );
    },
    initRenderer() {
      const container = document.getElementById('container');
      container.appendChild( renderer.domElement );
      container.appendChild( stats.dom );

      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.outputEncoding = THREE.LinearEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;      
    },
    initModelAnimation(model) {
      const clonedScene = model.scene;
      let meshName = null;
      let mixer = null;
      if (clonedScene.children[0] && clonedScene.children[0].children.length > 1) {
        meshName = clonedScene.children[0].children[1].name
      } else {
        meshName = clonedScene.children[0].children[0].name
      }
      if (clonedScene) {
        worldScene.add(clonedScene);
        const clonedMesh = clonedScene.getObjectByName(meshName);
        if (model.animations && model.animations.length > 0) {
          model.animations.map((animation) => {
            mixer = this.startAnimation( clonedMesh, model.animations, animation.name );
            mixers.push(mixer);
          })
        }
      }
    },
    startAnimation(skinnedMesh, animations, animationName) {

      const mixer = new THREE.AnimationMixer(skinnedMesh);
      const clip = THREE.AnimationClip.findByName(animations, animationName);

      if (clip) {
        const action = mixer.clipAction(clip);
        action.play();
      }
      return mixer;
    },
    loadModels(models) {
      let self = this;
      let numLoadedModels = 0;
      models.map((model) => {
        self.loadGltfModel(model, () => {
          ++ numLoadedModels;
          if ( numLoadedModels === models.length ) {
            console.log( "All models loaded" );
          }
        })
      })
    },
    loadGltfModel(model, onLoaded) {
      let self = this;
      // Specify path to a folder containing WASM/JS decoding libraries.
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.manager = loadingManager;
      loader.load( model.name, function (gltf) {
        const scene = gltf.scene;
        let bbox = new THREE.Box3().setFromObject(scene);
        let cent = bbox.getCenter(new THREE.Vector3());
        let size = bbox.getSize(new THREE.Vector3());

        //Rescale the object to normalized space
        let maxAxis = Math.max(size.x, size.y, size.z);
        
        bbox.setFromObject(scene);
        bbox.getCenter(cent);
        bbox.getSize(size);
        //Reposition to 0,halfY,0
        scene.position.copy(cent).multiplyScalar(-1);
        scene.position.y -= (size.y * 0.1);
        scene.add(new THREE.AxesHelper(5));
        scene.position.set( model.position.x, model.position.y, model.position.z );
        if (model.scale) {
          scene.scale.multiplyScalar(model.scale / maxAxis);
        } else {
          scene.scale.multiplyScalar(1.0 / maxAxis);
        }

        if (model.rotation) {
          scene.rotateY(model.rotation)
        }

        self.bindSceneEvent(scene);
        self.initModelAnimation(gltf);
        onLoaded();
      }, this.onProgress, this.onError);
    },
    bindSceneEvent(scene) {
      let objectsHover = [];
      const logDiv = document.getElementById('log-panel');
      logDiv.innerText = 'Model Infos Here';

      scene.traverse((child) => {
        if (child.children.length === 0) {
          // Add only objects widthout children
          if (child.material && child.material.emissive) {
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

            if (child.material && child.material.emissive) {
              child.userData.materialEmissiveHex = child.material.emissive.getHex();
              child.material.emissive.setHex(0xff0000);
              child.material.emissiveIntensity = 0.5;
            }
          });

          child.addEventListener('mouseout', (event) => {
            objectsHover = objectsHover.filter((n) => n !== event.target);
            if (objectsHover.length > 0) {
              const o = objectsHover[objectsHover.length - 1];
              if (o.material && o.material.emissive) {
                o.material.emissive.setHex(0xff0000)
              }
              logDiv.innerText = this.getPath(o);
            } else {
              logDiv.innerText = 'Model Infos Here';
            }

            document.body.style.cursor = 'default';

            if (child.material && child.material.emissive) {
              child.material.emissive.setHex(
                child.userData.materialEmissiveHex
              );
            }
          });

          child.addEventListener('mousedown', (event) => {
            event.stopPropagation();

            if (child.material && child.material.emissive) {
              child.material.emissive.setHex(0x0000ff);
            }

            const path = this.getPath(event.target);
            logDiv.innerText = path;
          });
        }
      })
    },
    animate() {
      const mixerUpdateDelta = clock.getDelta();

      requestAnimationFrame(this.animate);
      renderer.render(worldScene, camera);
      interactionManager.update();
      stats.update();
      mixers.map((mixer) => {
        mixer.update(mixerUpdateDelta)
      })
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
    },
    onWindowResize(){

      let windowHalfX = window.innerWidth/2;
      let windowHalfY = window.innerHeight/2;

      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth,window.innerHeight);

    }
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