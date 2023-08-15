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
// import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { InteractionManager  } from './three.interactive.module.js';
import * as geolib from 'geolib';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const stats = new Stats();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
const worldScene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

const labelRenderer = new CSS2DRenderer();

let directionalLight = new THREE.DirectionalLight(new THREE.Color(0xffffff));
const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 5 );
const hemisphereLight = new THREE.HemisphereLight( new THREE.Color(0xffffbb), new THREE.Color(0x080820), 1 );
const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight, 5 );

const orbitControls = new OrbitControls( camera, labelRenderer.domElement );

// // Instantiate a loader
const dracoLoader = new DRACOLoader();
const loader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// const interactionManager = new InteractionManager(
//   renderer,
//   camera,
//   renderer.domElement
// );

const loadingManager = new THREE.LoadingManager();
const clock = new THREE.Clock();
const sky = new Sky();
const sun = new THREE.Vector3();

let mixers = [];
const center = [116.48487986503507, 39.925106588670836]
const frustumSize = 600;

export default {
  name: "ThreeDraw",
  components: {},
  mounted() {
    this.initScene();
    this.initRenderer();
    this.initLight();
    this.animate();
  },
  methods: {
    initScene() {
      camera.position.set( 300, 100, 800 );
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      // const cameraHelper = new THREE.CameraHelper(camera);
      // worldScene.add(cameraHelper);

      const cameraPerspectiveHelper = new THREE.CameraHelper( camera );
      worldScene.add( cameraPerspectiveHelper );

      const aspect = window.innerWidth / window.innerHeight
      const cameraOrtho = new THREE.OrthographicCamera( 0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 150, 1000 );

      const cameraOrthoHelper = new THREE.CameraHelper( cameraOrtho );
      worldScene.add( cameraOrthoHelper );
      
      orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      orbitControls.dampingFactor = 0.25;
      orbitControls.screenSpacePanning = false;
      orbitControls.maxPolarAngle = Math.PI / 2.3;
      orbitControls.maxDistance = 400;
      orbitControls.minDistance = 10;

      orbitControls.update()

      directionalLight = new THREE.DirectionalLight(new THREE.Color(0xffffff));
      directionalLight.position.set(-40, 60, -10);

      directionalLight.shadow.camera.near = 20; //产生阴影的最近距离
      directionalLight.shadow.camera.far = 200; //产生阴影的最远距离
      directionalLight.shadow.camera.left = -50; //产生阴影距离位置的最左边位置
      directionalLight.shadow.camera.right = 50; //最右边
      directionalLight.shadow.camera.top = 50; //最上边
      directionalLight.shadow.camera.bottom = -50; //最下面

      //这两个值决定使用多少像素生成阴影 默认512
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.mapSize.width = 1024;

      //告诉平行光需要开启阴影投射
      directionalLight.castShadow = true;

      worldScene.background = new THREE.Color( 0xf0f0f0 );      
      worldScene.add(new THREE.AxesHelper(1000));
      worldScene.add(directionalLight);
      worldScene.add(directionalLightHelper);
      worldScene.add( hemisphereLight );
      worldScene.add( hemisphereLightHelper );
      // worldScene.background = new THREE.TextureLoader().load("assets/texture/galaxy.jpg");
      const gridHelper = new THREE.GridHelper(600, 160, new THREE.Color(0xf56c6c), new THREE.Color(0x409eff))
      gridHelper.position.y = -5;
      gridHelper.material.opacity = 0.65;
      gridHelper.material.transparent = true;
      worldScene.add( gridHelper );

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
      this.GetGeoJson('./assets/temp/china.json')

      window.addEventListener( 'resize', this.onWindowResize, false );
    },
    initRenderer() {
      const container = document.getElementById('container');
      container.appendChild( renderer.domElement );
      container.appendChild( stats.dom );

      // renderer.setClearColor(0x000000);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.shadowMap.Enabled = true;
      renderer.outputEncoding = THREE.LinearEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // document.body.appendChild(renderer.domElement);

      labelRenderer.setSize( window.innerWidth, window.innerHeight );
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      document.body.appendChild( labelRenderer.domElement );

      sky.scale.setScalar( 450000 );
      worldScene.add( sky );

      const effectController = {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 60,
        exposure: renderer.toneMappingExposure
      };

      const uniforms = sky.material.uniforms;
      uniforms[ 'turbidity' ].value = effectController.turbidity;
      uniforms[ 'rayleigh' ].value = effectController.rayleigh;
      uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
      uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
      const theta = THREE.MathUtils.degToRad( effectController.azimuth );

      sun.setFromSphericalCoords( 1, phi, theta );

      uniforms[ 'sunPosition' ].value.copy( sun );

      renderer.toneMappingExposure = effectController.exposure;

    },
    initLight() {
      // Init Light
      let light0 = new THREE.AmbientLight(new THREE.Color(0xfafafa), 0.25)

      let light1 = new THREE.PointLight(new THREE.Color(0xfafafa), 0.4)
      light1.position.set(200, 90, 40)

      let light2 = new THREE.PointLight(new THREE.Color(0xfafafa), 0.4)
      light2.position.set(200, 90, -40)

      worldScene.add(light0)
      worldScene.add(light1)
      worldScene.add(light2)
    },
    animate() {
      const mixerUpdateDelta = clock.getDelta();

      requestAnimationFrame(this.animate);
      renderer.render(worldScene, camera);
      labelRenderer.render( worldScene, camera );
      // interactionManager.update();
      // worldScene.rotation.y += 0.002;
      stats.update();
      mixers.map((mixer) => {
        mixer.update(mixerUpdateDelta)
      })
    },
    bindSceneEvent(scene) {
      let objectsHover = [];
      const logDiv = document.getElementById('log-panel');
      logDiv.innerText = 'Model Infos Here';

      const lableDiv = document.createElement('div');
      lableDiv.setAttribute('style', 'background: rgba(0, 0, 0, .6);color:#efefef;padding: 5px;font-size:10px;margin-top: -1em;border-radius: 3px;padding: 3px 8px;');
      const sceneLabel = new CSS2DObject(lableDiv);
      scene.traverse((child) => {
        if (child.children.length === 0) {
          // Add only objects widthout children
          if (child.material && child.material.emissive) {
            child.material = child.material.clone();
            child.userData.initialEmissive = child.material.emissive.clone();
            child.material.emissiveIntensity = 0.5;
          }

          // interactionManager.add(child);
          
          child.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            // event.preventDefault();
            if (!objectsHover.includes(child))
              objectsHover.push(child);
            const overcolor = new THREE.Color(0xff0000);
            const v3 = new THREE.Vector3(child.geometry.boundingBox.max.x, child.geometry.boundingBox.max.y, child.geometry.boundingBox.max.z);
            console.log(v3)

            scene.material.color.setRGB(overcolor.r, overcolor.g, overcolor.b);
            // console.log(scene.userData.properties.PMZ_NAME)

            document.body.style.cursor = 'pointer';

            const path = this.getPath(event.target);
            logDiv.innerText = path;

            
            lableDiv.textContent = child.userData.properties.PMZ_NAME ? child.userData.properties.PMZ_NAME : 'Null';
            const position = child.geometry.boundingSphere.center ? child.geometry.boundingSphere.center : {x: 0, y: 0, z: 0};
            sceneLabel.position.set(position.x, position.y + 1.5, position.z);
            child.add(sceneLabel);

            if (child.material && child.material.emissive) {
              child.userData.materialEmissiveHex = child.material.emissive.getHex();
              child.material.emissive.setHex(new THREE.Color(0xff0000));
              child.material.emissiveIntensity = 0.5;
            }
          });

          child.addEventListener('mouseout', (event) => {
            child.remove(sceneLabel);
            objectsHover = objectsHover.filter((n) => n !== event.target);
            if (objectsHover.length > 0) {
              const o = objectsHover[objectsHover.length - 1];
              if (o.material && o.material.emissive) {
                o.material.emissive.setHex(new THREE.Color(0xff0000))
              }
              logDiv.innerText = this.getPath(o);
            } else {
              logDiv.innerText = 'Model Infos Here';
            }
            const outcolor = new THREE.Color(0x409eff);
            scene.material.color.setRGB(outcolor.r, outcolor.g, outcolor.b)

            document.body.style.cursor = 'default';

            if (child.material && child.material.emissive) {
              child.material.emissive.setHex(
                child.userData.materialEmissiveHex
              );
            }
          });

          child.addEventListener('mousedown', (event) => {
            console.log(666)

            // event.stopPropagation();

            if (child.material && child.material.emissive) {
              child.material.emissive.setHex(new THREE.Color(0x0000ff));
            }

            const path = this.getPath(event.target);
            logDiv.innerText = path;
          });
        }
      })
    },
    GetGeoJson(api) {
      let self = this;

      fetch(api).then((res) => {
      
        res.json().then((data) => {

          self.LoadBuildings(data)
          
        })
      })
    },

    LoadBuildings(data) {

      let features = data.features

      for (let i = 0; i < features.length; i++) {
        
        let fel = features[i]
        if (!fel['properties']) return

        if (fel.properties['building']) {
          this.addBuilding(fel.geometry.coordinates, fel.properties, fel.properties["building:levels"])
        } else {
          this.addBuilding(fel.geometry.coordinates, fel.properties, null)
        }
      }
    },

    addBuilding(data, info, height) {
      const texture = new THREE.TextureLoader().load('./assets/textures/glass.jpg');
      const MAT_BUILDING = new THREE.MeshPhongMaterial({color: new THREE.Color(0x666666)});
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0x409eff)});
      for (let i = 0; i < data.length; i++) {
        let el = data[i]

        let shape = this.genShape(el, center)
        let geometry = this.genGeometry(shape, {
          curveSegments: 1,
          depth: height ? 0.6 * height : 0.5,
          bevelEnabled: false
        })

        geometry.rotateX(Math.PI / 2)
        geometry.rotateZ(Math.PI)

        const geometryEdges = new THREE.EdgesGeometry(geometry, 1);
        const edgesMtl =  new THREE.LineBasicMaterial({color: new THREE.Color(0x409eff)});
        const geometryLine = new THREE.LineSegments(geometryEdges, edgesMtl);

        let mesh = new THREE.Mesh(geometry, height ? MAT_BUILDING_TEXTURE : MAT_BUILDING);
        mesh.userData.properties = info;
        worldScene.add(mesh)
        worldScene.add(geometryLine);
        if (height) {
          this.bindSceneEvent(mesh)
        }
      }
    },

    genShape(points, center) {
      let shape = new THREE.Shape()

      for (let i = 0; i < points.length; i++) {
        let elp = points[i]
        elp = this.GPSRelativePosition(elp, center)

        if (i == 0) {
          shape.moveTo(elp[0], elp[1])
        } else {
          shape.lineTo(elp[0], elp[1])
        }
      }

      return shape
    },

    genGeometry(shape, settings) {
      let geometry = new THREE.ExtrudeBufferGeometry(shape, settings)
      geometry.computeBoundingBox()

      return geometry
    },
    GPSRelativePosition(objPosi, centerPosi) {

      // Get GPS distance
      let dis = geolib.getDistance(objPosi, centerPosi)

      // Get bearing angle
      let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)

      // Calculate X by centerPosi.x + distance * cos(rad)
      let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))

      // Calculate Y by centerPosi.y + distance * sin(rad)
      let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))

      // Reverse X (it work) 
      return [-x / 100, y / 100]
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

      if (object.parent && object.userData.properties.PMZ_NAME) {
        return this.getPath(object.parent) + ' > ' + string + object.userData.properties.PMZ_NAME;
      } else {
        return string;
      }
    },
    onWindowResize(){

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize( window.innerWidth, window.innerHeight );

    }
  },
};
</script>

<style scoped>
.label {
  color: #000000;
  padding: 2px;
  background: rgba( 0, 0, 0, .6 );
  font-size: 12px;
  border-radius: 5px;
  line-height: 1;
}
#container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000 url(../assets/bg.jpeg) no-repeat 50% 50%;
  background-size: cover;
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
  height: 100%;
  background: rgba(34, 34, 34, .75);
  color:#00f3f7;
  padding: 5px;
  font-size:10px;
  border-left: 1px solid #5c5c5c;
}
</style>