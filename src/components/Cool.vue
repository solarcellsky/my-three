<template>
  <div class="container" id="container">
    <div class="gl" id="gl">
      <Slider @onChange="setOpacity" />
    </div>
    <div class="labels" id="labels"></div>
    <div class="progress-bar" id="progressBar">
      <div class="spinner-wrap" id="spinnerWrap">
        <div class="spinner-box">
          <div class="spinner-track"></div>
          <div class="spinner"></div>
        </div>
        <div id="loadedPercent">LOADING</div>
      </div>
    </div>
  </div>
</template>
<script>
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { InteractionManager  } from './three.interactive.module.js';
import Slider from '../components/common/ui/Slider'
import SceneArea from "../components/common/scene/SceneArea";
import ArrowFlow from "../components/common/scene/ArrowFlow";
import AnimateLine from "../components/common/scene/AnimateLine";
import SkyBox from "../components/common/scene/SkyBox";
import Compass from "../components/common/scene/Compass";

export default {
  name: "Cool",
  components: {
    Slider
  },
  data() {
    return {
      models: [
        // { name: 'assets/campusalbano/environment.glb', position: { x: 0, y: 0, z: 0 } },
        { name: 'assets/campusalbano/buildings.glb', position: { x: 0, y: 0, z: 0 } }
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
      this.initLights();
      this.initHelpers();
      this.initControls();
      this.initLabels();
      this.animate();
      this.loadModels(this.models);
      this.initSceneComponets();
    },
    initScene() {
      const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
      const worldScene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

      const interactionManager = new InteractionManager(
        renderer,
        camera,
        renderer.domElement
      );

      window.interactionManager = interactionManager;

      // const pmremGenerator = new THREE.PMREMGenerator( renderer );
      // worldScene.background = new THREE.Color( 0xbfe3dd );
      // worldScene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
      worldScene.background = new THREE.Color( 0xcce0ff );
      worldScene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

      window.camera = camera;
      window.worldScene = worldScene;
      window.renderer = renderer;

      window.addEventListener('resize', this.onWindowResize, false);
    },
    initRenderer() {
      const stats = new Stats();
      window.stats = stats;
      const container = document.getElementById('gl');
      container.appendChild( window.renderer.domElement );
      container.appendChild( stats.dom );

      // window.renderer.setClearColor(0x363636);
      window.renderer.setPixelRatio(window.devicePixelRatio);
      window.renderer.setSize( window.innerWidth, window.innerHeight );
      window.renderer.outputEncoding = THREE.LinearEncoding;
      window.renderer.shadowMap.enabled = true;
      window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    },
    initCameras() {
      window.camera.position.set( 1000, 50, 1500 );
      const helper = new THREE.CameraHelper( window.camera );
      window.worldScene.add( helper );
    },
    initLights() {

      // const light = new THREE.DirectionalLight( 0xdfebff, 1 );
      // light.position.set( 50, 200, 100 );
      // light.position.multiplyScalar( 1.3 );

      // light.castShadow = true;

      // light.shadow.mapSize.width = 1024;
      // light.shadow.mapSize.height = 1024;

      // const d = 300;

      // light.shadow.camera.left = - d;
      // light.shadow.camera.right = d;
      // light.shadow.camera.top = d;
      // light.shadow.camera.bottom = - d;

      // light.shadow.camera.far = 1000;

      // worldScene.add( light );

      // TEXT

        const loader = new THREE.FontLoader();
        loader.load( 'assets/fonts/FZYaoTi_Regular.json', function ( font ) {

          const textGeo = new THREE.TextGeometry( "航天配水厂", {

            font: font,

            size: 100,
            height: 25,
            curveSegments: 6,

            bevelThickness: 1,
            bevelSize: 1,
            bevelEnabled: true

          } );

          textGeo.computeBoundingBox();
          const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

          const textMaterial = new THREE.MeshPhongMaterial( { color: 0x0095ff, specular: 0xffffff } );

          const mesh = new THREE.Mesh( textGeo, textMaterial );
          mesh.position.x = centerOffset;
          mesh.position.y = - 250 + 67;

          mesh.castShadow = true;
          mesh.receiveShadow = true;

          worldScene.add( mesh );

        } );

      // ground

      const groundTexture = new THREE.TextureLoader().load( 'assets/textures/terrain/grasslight-big.jpg' );
      groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set( 25, 25 );
      groundTexture.anisotropy = 16;
      groundTexture.encoding = THREE.sRGBEncoding;

      const groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );

      let mesh = new THREE.Mesh( new THREE.PlaneGeometry( 20000, 20000 ), groundMaterial );
      mesh.position.y = - 250;
      mesh.rotation.x = - Math.PI / 2;
      mesh.receiveShadow = true;
      worldScene.add( mesh );

      const directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set( 50, 200, 100 );
      directionalLight.position.multiplyScalar( 1.3 );

      directionalLight.castShadow = true;

      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;

      const d = 300;

      directionalLight.shadow.camera.left = - d;
      directionalLight.shadow.camera.right = d;
      directionalLight.shadow.camera.top = d;
      directionalLight.shadow.camera.bottom = - d;
      directionalLight.shadow.camera.far = 1000;

      const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 50 );
      const hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
      const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight, 50 );
      const spotLight = new THREE.SpotLight( 0x666666, 1 );
      spotLight.position.set( 15, 40, 35 );
      spotLight.angle = Math.PI / 2;
      spotLight.penumbra = 0.5;
      spotLight.decay = 1;
      spotLight.distance = 200;

      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 512;
      spotLight.shadow.mapSize.height = 512;
      spotLight.shadow.camera.near = 30;
      spotLight.shadow.camera.far = 500;
      spotLight.shadow.focus = 1;
      const spotLightHelper = new THREE.SpotLightHelper( spotLight, 5 );

      const lightGroup = new THREE.Group();
      lightGroup.add(directionalLight, hemisphereLight, spotLight, directionalLightHelper, hemisphereLightHelper, spotLightHelper);
      worldScene.add(lightGroup);
    },
    initHelpers() {
      const axesHelper = new THREE.AxesHelper(36);

      const sphereGeometry = new THREE.SphereGeometry( 1200, 1200, 1200 );
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('assets/texture/starry.jpg', (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const sphereMaterial = new THREE.MeshPhongMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
        });

        const skySphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        // worldScene.add(skySphere)
      });

      const gridHelper = new THREE.GridHelper(300, 160, new THREE.Color(0xffffff), new THREE.Color(0xececec))
      gridHelper.position.y = -5;
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;

      const helperGroup = new THREE.Group();
      
      helperGroup.add(axesHelper, gridHelper);
      worldScene.add(helperGroup);
    },
    initControls() {
      const interaciveEl = document.getElementById('labels');
      const orbitControls = new OrbitControls( window.camera, window.renderer.domElement );
      orbitControls.maxPolarAngle = Math.PI / 2;
      orbitControls.screenSpacePanning = false;
      orbitControls.minDistance = 100;
      orbitControls.maxDistance = 5000;
      // orbitControls.scaleFactor = 0.04;
      // orbitControls.enableDamping = true;
      // orbitControls.dampingFactor = 0.25;
      // orbitControls.enableZoom = true;
      // orbitControls.zoomSpeed = 0.2;
      // orbitControls.enablePan = false;
      // // orbitControls.autoRotate = true;
      // // orbitControls.autoRotateSpeed = 0.08;
      // orbitControls.maxPolarAngle = 1.3;
      // orbitControls.minPolarAngle = 0.5;
      // orbitControls.enableKeys = false;
      // orbitControls.minDistance = 0;
      // orbitControls.maxDistance = 10000;
      // controls
      orbitControls.listenToKeyEvents( window );
      window.orbitControls = orbitControls;
      window.interaciveEl = interaciveEl;
    },
    initLoadingManager() {
      const loadingManager = new THREE.LoadingManager();
      window.loadingManager = loadingManager;
      const progressBar = document.getElementById('progressBar');
      if (progressBar) {
        loadingManager.onProgress = function (item, loaded, total) {
          progressBar.style.opacity = 1 - (loaded / total);
        };

        loadingManager.onLoad = function () {
          setTimeout(() => {
            progressBar.style.zIndex = -1;
          }, 500);
        };
      }
    },
    initLabels() {
      window.interaciveEl.style.opacity = 1;
    },
    initSceneComponets() {
      // 
      const options = {
        x: 0, 
        z: 0, 
        width: 50, 
        length: 40, 
        lineWidth: 0.2,
        scene: worldScene,
        name: "ID1$1号清水池", 
        textColor: 0x00ffff, 
        fontSize: 0.5, 
        textPosition: '左对齐'
      }

      const options1 = {
        pathArr: [
          0, 3, 0,
          2, 3, 0,
          2, 3, 3,
          2, 6, 6
        ],
        repeatX: 20,
        repeatY: 4,
        radius: 0.1,
        left: true,
      }

      const options2 = {
        pathArr: [
          -1, 3, 0,
          -2, 3, 0,
          -2, 3, 3,
          -2, 6, 6
        ],
        repeatX: 20,
        repeatY: 4,
        radius: 0.1,
        left: false,
      }

      const tubeOptions = [
        {
          path: [
            0, 3, 0,
            2, 3, 0,
            2, 3, 3,
            2, 6, 6
          ],
          repeatX: 20,
          repeatY: 4,
          radius: 1,
          left: true,
        },
        {
          path: [
            -1, 3, 0,
            -2, 3, 0,
            -2, 3, 3,
            -2, 6, 6
          ],
          repeatX: 20,
          repeatY: 4,
          radius: 1,
          left: false,
        }
      ];

      const alineOptins =  [
        {
          path: [
            5, 3, 0,
            7, 3, 0,
            7, 3, 3,
            7, 6, 6
          ],
          repeatX: 20,
          repeatY: 1,
          radius: 2,
          left: false,
        }
      ];

      const urls = [
        'assets/texture/skybox/远山_RT.jpg', // right
        'assets/texture/skybox/远山_LF.jpg', // left
        'assets/texture/skybox/远山_UP.jpg', // top
        'assets/texture/skybox/远山_DN.jpg', // bottom
        'assets/texture/skybox/远山_BK.jpg', // back
        'assets/texture/skybox/远山_FR.jpg'  // front
      ];

      const area = new SceneArea(options);
      area.create();

      tubeOptions.map((option) => {
        const tube = new ArrowFlow(option, worldScene);
        tube.create()
      })

      alineOptins.map((option) => {
        const aline = new AnimateLine(option, worldScene);
        aline.create()
      })

      const skybox = new SkyBox(urls, worldScene);
      // skybox.create()

      const compass = new Compass({
        container: 'container',
        renderer: renderer,
        scene: worldScene,
        camera: camera
      });
      compass.create();
      // 
    },
    setOpacity(val) {
      window.interaciveEl.style.opacity = 1 - val;
      worldScene.children.map((child) => {
        if (child.children && child.children[0] instanceof THREE.Mesh) {
          child.children[0].material.opacity = val;
        }
        
      })
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
      // const fbxloader = new FBXLoader();
      // fbxloader.manager = window.loadingManager;
      // fbxloader.load('assets/dsf.fbx', function(object) {
      //   console.log(object)
      //   object.scale.set(0.002, 0.002, 0.002);
      //   object.position.set(-5, 0, -15);
      //   worldScene.add(object)
      //   onLoaded();
      // }, this.onProgress, this.onError);
      const loadStartTime = performance.now();
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0x409eff), opacity: .3, transparent: true});

      const tempV = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
      // Specify path to a folder containing WASM/JS decoding libraries.
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.manager = window.loadingManager;
      loader.load( model.name, function (gltf) {
        console.info( 'Load time: ' + ( performance.now() - loadStartTime ).toFixed( 2 ) + ' ms.' );
        let scene = gltf.scene;
        // scene.scale.set(0.01, 0.01, 0.01);
        worldScene.add(scene)
        // scene.traverse((node) => {
        //   node.traverse((n) => {
        //     window.interactionManager.add(n);
        
        //     n.addEventListener('mousedown', (event) => {
        //       console.log(n)
        //       event.stopPropagation();
        //       console.log(n.name)
        //       document.body.style.cursor = 'pointer';
        //     });
        //   })
        // });

        // scene.traverse((node) => {
        //   if (!node.isMesh) return;
        //   const mesh = new THREE.Mesh(node.geometry, MAT_BUILDING_TEXTURE);
        //   const geometryEdges = new THREE.EdgesGeometry(node.geometry, 1);
        //   mesh.scale.set(0.01, 0.01, 0.01);
        //   geometryEdges.scale(0.01, 0.01, 0.01);
        //   mesh.updateWorldMatrix(true, false);
        //   mesh.getWorldPosition(tempV);
        //   const edgesMtl =  new THREE.LineBasicMaterial({color: new THREE.Color(0x409eff)});
        //   const geometryLine = new THREE.LineSegments(geometryEdges, edgesMtl);
        //   const group = new THREE.Group();
        //   group.add(mesh, geometryLine);
        //   worldScene.add(group);

        //   let lableDiv = document.createElement('div');
        //   lableDiv.setAttribute('class', 'label');
        //   lableDiv.innerHTML = '<div class="line"></div><div class="tag">' + mesh.id + '</div>';

          
        //   tempV.project(window.camera);
        //   raycaster.setFromCamera(tempV, window.camera);
        //   const intersectedObjects = raycaster.intersectObjects(scene.children);
        //   const show = intersectedObjects.length && node === intersectedObjects[0].object;
        //   window.interaciveEl.appendChild(lableDiv);

        //   if (!show || Math.abs(tempV.z) > 1) {
        //     // hide the label
        //     lableDiv.style.display = 'none';
        //   } else {
        //     // unhide the label
        //     lableDiv.style.display = '';

        //     // convert the normalized position to CSS coordinates
        //     const x = (tempV.x *  .5 + .5) * renderer.domElement.clientWidth;
        //     const y = (tempV.y * -.5 + .5) * renderer.domElement.clientHeight;

        //     // move the elem to that position
        //     lableDiv.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
        //   }
        // });
        onLoaded();
      }, this.onProgress, this.onError);
    },
    onProgress(xhr) {
      if ( xhr.lengthComputable ) {
        let percentComplete = xhr.loaded / xhr.total * 100;
        let lodingContainer = document.getElementById('loadedPercent');
        lodingContainer.innerHTML = Math.round(percentComplete, 2) + '% DOWNLOADED';
      }
    },
    onError(xhr) {
      console.log('err', xhr)
    },
    animate() {
      requestAnimationFrame(this.animate);
      window.orbitControls.update();
      window.camera.updateProjectionMatrix();
      window.renderer.render(window.worldScene, window.camera);
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

<style lang="scss">
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;

  .compass {
    position: absolute;
    top: 10px;
    right: 30px;
    width: 120px;
    height: 120px;
    opacity: .65;
    z-index: 9;
  }

  .gl {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .labels {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    transition: opacity .5s ease-out;
    z-index: 9;

    .label {
      position: absolute;
      opacity: 0.8;
      transform: scale(1, 1);
      left: 300px;
      top: 300px;
      cursor: pointer;
      transition: all .3s ease-out;

      &:hover,
      &.selected {
        .tag {
          background-color: #e00606;
        }
        .line {
          border-color: red;
        }
      }
      &:hover {
        transform: scale(1.1, 1.1);
      }
      .line {
        position: absolute;
        height: 30px;
        width: 30px;
        bottom: 0;
        left: 15px;
        border-left: 2px solid #999999;
        -moz-transform: skew(-40deg);
        -webkit-transform: skew(-40deg);
        transform: skew(-40deg);
      }

      .tag {
        position: absolute;
        bottom: 30px;
        left: 28px;
        font-size: 12px;
        background-color: #999999;
        color: #fff;
        padding: 2px 8px;
        text-transform: uppercase;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color .2s ease-out;
        border-radius: 3px 3px 3px 0;
      }
    }
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
      color:#00f3f7;
      padding: 5px;
      font-size:10px;
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
          background: -moz-linear-gradient(left, #ffffff 10%, rgba(255, 255, 255, 0) 42%);
          background: -webkit-linear-gradient(left, #ffffff 10%, rgba(255, 255, 255, 0) 42%);
          background: -o-linear-gradient(left, #ffffff 10%, rgba(255, 255, 255, 0) 42%);
          background: -ms-linear-gradient(left, #ffffff 10%, rgba(255, 255, 255, 0) 42%);
          background: linear-gradient(to right, #ffffff 10%, rgba(255, 255, 255, 0) 42%);
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
            content: '';
          }
          &:after {
            background: #505050;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            content: '';
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
</style>