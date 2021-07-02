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
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { InteractionManager  } from './three.interactive.module.js';

export default {
  name: "WireFrame",
  components: {},
  data() {
    return {
      models: [
        { name: 'assets/z.glb', position: { x: 0, y: 0, z: 0 } }
      ]
    }
  },
  mounted() {
    this.initLoadingManager();
    this.initScene();
    this.initCameras();
    this.initRenderer();
    this.initHelpers();
    this.initControls();
    this.animate();
  },
  methods: {
    initScene() {
      const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 3000 );
      const worldScene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

      const labelRenderer = new CSS2DRenderer();

      const interactionManager = new InteractionManager(
        renderer,
        camera,
        renderer.domElement
      );

      window.camera = camera;
      window.worldScene = worldScene;
      window.renderer = renderer;
      window.labelRenderer = labelRenderer;
      window.interactionManager = interactionManager;
      

      this.loadModels(this.models);
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
      window.camera.position.set( 20, 20, 20 );
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
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControls.screenSpacePanning = true;
      orbitControls.maxPolarAngle = Math.PI / 2;
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
          progressBar.style.width = '100%';
          setTimeout(() => {
            progressBar.style.display = 'none';
          }, 500);
        };
      }
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
      let floors = [];
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0x409eff), opacity: .3, transparent: true});
      // Specify path to a folder containing WASM/JS decoding libraries.
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.manager = window.loadingManager;
      loader.load( model.name, function (gltf) {
        let scene = gltf.scene;
        scene.traverse((node) => {
          if (!node.isMesh) return;
          const mesh = new THREE.Mesh(node.geometry, MAT_BUILDING_TEXTURE);
          const geometryEdges = new THREE.EdgesGeometry(node.geometry, 1);
          mesh.scale.set(0.12,0.12,0.12);
          geometryEdges.scale(0.12,0.12,0.12);
          const edgesMtl =  new THREE.LineBasicMaterial({color: new THREE.Color(0x409eff)});
          const geometryLine = new THREE.LineSegments(geometryEdges, edgesMtl);
          const group = new THREE.Group();
          group.add(mesh, geometryLine);
          worldScene.add(group);
          floors.push({uuid: mesh.uuid, mesh: mesh});
          self.bindSceneEvent(mesh);
        });
        self.drawFloors(floors)
        onLoaded();
        // self.bindEvents(scene);
      }, this.onProgress, this.onError);
    },
    drawFloors(floors) {
      let self = this;
      let y = 0;
      let f = 0;
      const fontLoader = new THREE.FontLoader();

      //create a blue LineBasicMaterial
      const lineMaterial = new THREE.LineBasicMaterial( { color: 0x00ffff } );

      fontLoader.load('./assets/fonts/helvetiker_bold.typeface.json', function(font) {
        const materials = [
          new THREE.MeshBasicMaterial( { color: 0xffffff } ), // front
          new THREE.MeshBasicMaterial( { color: 0xffffff } ) // side
        ];
        floors.map((floor, index) => {
          if (index > 26) return;
          y += 0.45;
          f += 1
          const textGeometry = new THREE.TextGeometry( 'F' + f, {
            font: font,
            size: 1,
            height: .1,
          });
          textGeometry.computeBoundingBox();

          let textMesh = new THREE.Mesh( textGeometry, materials );

          textMesh.position.x = 4.2;
          textMesh.position.y = y;
          textMesh.position.z = 0;
          textMesh.scale.set(0.1, 0.1, 0.1);

          const points = [];
          points.push( new THREE.Vector3( 4.5, y - 0.1, 0 ) );
          points.push( new THREE.Vector3( 3.5, y - 0.1, 0 ) );
          points.push( new THREE.Vector3( 2.5, y - 0.5, 0 ) );

          const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
          const line = new THREE.Line( lineGeometry, lineMaterial );
          const group = new THREE.Group();
          group.add(line, textMesh);
          worldScene.add(group);
          self.bindEvents(group, floor);
          // console.log(y + '---------', floor, '-----' + index)
        })
      });
    },
    bindEvents(scene, floor) {
      let objectsHover = [];
      scene.traverse((child) => {
        window.interactionManager.add(child);
        
        child.addEventListener('mouseover', (event) => {
          event.stopPropagation();
          if (!objectsHover.includes(floor))
              objectsHover.push(floor);

          const floorovercolor = new THREE.Color(0x0000ff);
          worldScene.children.map((g) => {
            if (g.children[0] instanceof THREE.Mesh && g.children[0].uuid === floor.uuid) {
              console.log(g.children[0].material, g.children[0].uuid)
              g.children[0].material.color.setRGB(floorovercolor.r, floorovercolor.g, floorovercolor.b);
              g.children[0].material.opacity = .5;
            }
          })
          document.body.style.cursor = 'pointer';
        });

        child.addEventListener('mouseout', (event) => {
          objectsHover = objectsHover.filter((n) => n !== event.target);
          const flooroutcolor = new THREE.Color(0x409eff);
          worldScene.children.map((g) => {
            if (g.children[0] instanceof THREE.Mesh && g.children[0].uuid === floor.uuid) {
              g.children[0].material.color.setRGB(flooroutcolor.r, flooroutcolor.g, flooroutcolor.b);
              g.children[0].material.opacity = .1;
            }
          })

          document.body.style.cursor = 'default';
        });
      })
    },
    bindSceneEvent(scene) {
      let objectsHover = [];
      const logDiv = document.getElementById('log-panel');
      logDiv.innerText = 'Model Infos Here';

      const lableDiv = document.createElement('div');
      lableDiv.setAttribute('style', 'background: rgba(0, 0, 255, .6);color:#efefef;padding: 5px;font-size:10px;margin-top: -1em;border-radius: 3px;padding: 3px 8px;');
      const sceneLabel = new CSS2DObject(lableDiv);

      scene.traverse((child) => {
        if (child.children.length === 0) {
          // Add only objects widthout children
          if (child.material && child.material.emissive) {
            child.material = child.material.clone();
            child.userData.initialEmissive = child.material.emissive.clone();
            child.material.emissiveIntensity = 0.5;
          }

          window.interactionManager.add(child);
          
          child.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            if (!objectsHover.includes(child))
              objectsHover.push(child);
            const overcolor = new THREE.Color(0x0000ff);
            scene.material.color.setRGB(overcolor.r, overcolor.g, overcolor.b);
            scene.material.opacity = .5;

            document.body.style.cursor = 'pointer';

            const path = this.getPath(event.target);
            logDiv.innerText = path;
            
            lableDiv.textContent = child.uuid;
            const position = child.geometry.boundingSphere.center ? child.geometry.boundingSphere.center : {x: 0, y: 0, z: 0};
            sceneLabel.position.set(position.x + 3, position.y + 1.5, position.z);
            child.add(sceneLabel);
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
            scene.material.opacity = .1;

            document.body.style.cursor = 'default';
          });

          child.addEventListener('mousedown', (event) => {
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
    animate() {
      requestAnimationFrame(this.animate);
      window.renderer.render(window.worldScene, window.camera);
      window.labelRenderer.render(window.worldScene, window.camera);
      window.interactionManager.update();
      window.stats.update();
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
      window.camera.aspect = window.innerWidth / window.innerHeight;
      window.camera.updateProjectionMatrix();

      window.renderer.setSize(window.innerWidth, window.innerHeight);

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