<template>
<div class="container" id="container">
  <div class="gl" id="gl"></div>
  <div id="echarts" :class="panelExpand ? 'echarts expand' : 'echarts'"></div>
  <Hamburg @toggleInfoPanels="toggleInfoPanels" />
  <div id="infoWindows" :class=" infoExpand ? 'info-windows right' : 'info-windows'">
    <div class="close-info-window" @click="toggleInfoWindows">
      <img src="assets//ui/close.svg" alt="">
    </div>
    <div id="windows"></div>
  </div>
  <Clock />
  <div class="cam-panel-container">
    <CamPlayer v-for="(v, k) in cams" :key="k" :stream="v.video" :name="v.name" />
  </div>
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
import * as TWEEN from "tween.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS3DRenderer, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { Interaction } from '../components/three.interaction/src/index.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import Compass from "../components/common/scene/Compass";
import ArrowFlow from "../components/common/scene/ArrowFlow";
import AnimateLine from "../components/common/scene/AnimateLine";
import PumpLineCharts from "../components/common/echarts/PumpLineCharts";
import PumpTensionLineCharts from "../components/common/echarts/PumpTensionLineCharts";
import LowTensionLineCharts from "../components/common/echarts/LowTensionLineCharts";
import HighTensionLineCharts from "../components/common/echarts/HighTensionLineCharts";
import Hamburg from '../components/common/ui/Hamburg';
import Clock from '../components/common/widgets/Clock';
import CamPlayer from '../components/common/scene/CamPlayer';


export default {
  components: {
    Hamburg,
    Clock,
    CamPlayer,
  },
  data() {
    return {
      panelExpand: true,
      infoExpand: false,
      models: [
        { name: 'assets/models/water/dx03.fbx', position: { x: 0, y: 0, z: 0 } },
        { name: 'assets/models/water/laibu_bf.fbx', position: { x: 0, y: 0, z: 0 } }
      ],
      cams: [
        {
          video: 'rtsp://174.6.126.86/axis-media/media.amp',
          name: 'Cam-01'
        },
        {
          video: 'rtsp://157.157.138.235/axis-media/media.amp',
          name: 'Cam-02'
        },
        {
          video: 'rtsp://admin:URFJFO@192.168.10.113:554/h264/ch1/main/av_stream',
          name: 'Cam-03'
        },
        {
          video: 'rtsp://weathercam.gsis.edu.hk/axis-media/media.amp',
          name: 'Cam-HK'
        }
      ]
    }
  },
  mounted() {
    this.initThree();
    this.loadModels(this.models);
  },
  methods: {
    initThree() {
      const container = document.getElementById('gl');
      const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
      camera.position.set( 250, 60, 300 );
      camera.lookAt( -50, 0, -100 );

      const worldScene = new THREE.Scene();
      const sceneCSS = new THREE.Scene();

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0xcaeceb);
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.outputEncoding = THREE.LinearEncoding;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const rendererCSS = new CSS3DRenderer();
      rendererCSS.setSize( window.innerWidth, window.innerHeight );
      rendererCSS.domElement.style.position = 'absolute';
      rendererCSS.domElement.style.top = '0px';
      container.appendChild( rendererCSS.domElement );


      // performance monitor
      const stats = new Stats();
      container.appendChild( renderer.domElement );
      container.appendChild( stats.dom );

      // orbit controls
      const orbitControls = new OrbitControls( camera, rendererCSS.domElement );
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
      orbitControls.listenToKeyEvents( window );

      // lights
      const directionalLight = new THREE.DirectionalLight(0xffffff);
      const hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
      const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight, 150, new THREE.Color(0xff0000) );
      const hemisphereLightHelper = new THREE.HemisphereLightHelper( hemisphereLight, 100, new THREE.Color(0x202020) );
      const lightGroup = new THREE.Group();
      lightGroup.add(directionalLight, hemisphereLight);
      worldScene.add(lightGroup);

      const worldSceneBackground = new THREE.TextureLoader().load("assets/texture/terrain-wireframe.jpeg");
      worldScene.background = worldSceneBackground;
      const axesHelper = new THREE.AxesHelper(360);
      const gridHelper = new THREE.GridHelper(666, 160, new THREE.Color(0x00ffff), new THREE.Color(0x202020));
      const helperGroup = new THREE.Group();
      helperGroup.add(axesHelper, gridHelper);
      gridHelper.position.y = -5;
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;
      worldScene.add(helperGroup);

      const compass = new Compass({
        container: 'container',
        renderer: renderer,
        scene: worldScene,
        camera: camera
      });
      compass.create();

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
      };

      // expose global objects
      window.camera = camera;
      window.worldScene = worldScene;
      window.sceneCSS = sceneCSS;
      window.renderer = renderer;
      window.rendererCSS = rendererCSS;
      window.stats = stats;
      window.orbitControls = orbitControls;

      this.render();
      this.initChartsPanel();

      window.addEventListener('resize', this.onWindowResize, false);
    },
    initChartsPanel() {
      const mypumpcharts = new PumpLineCharts({
        container: 'echarts'
      });
      const mypumptensioncharts = new PumpTensionLineCharts({
        container: 'echarts'
      });
      
      const mylowcharts = new LowTensionLineCharts({
        container: 'echarts'
      });
      const myhighcharts = new HighTensionLineCharts({
        container: 'echarts'
      });

      mypumpcharts.create();
      mypumptensioncharts.create();
      mylowcharts.create();
      myhighcharts.create();

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

      // tubeOptions.map((option) => {
      //   const tube = new ArrowFlow(option, worldScene);
      //   tube.create()
      // })

      // alineOptins.map((option) => {
      //   const aline = new AnimateLine(option, worldScene);
      //   aline.create()
      // })
    },
    initLabels(datas) {
      const self = this;
      let labels = [];
      const group = new THREE.Group();

      datas.forEach((o, i) => {
        labels.push({
          id: i + 1,
          uuid: o.uuid,
          name: o.name,
          center: o.center,
          position: o.position,
          power: (Math.random() + 5).toFixed(2),
          voltage: (Math.random() + 380).toFixed(2),
          electric_current: (Math.random() + 10).toFixed(2),
          pressure: Math.random().toFixed(2)
        })
      });

      const MAT_OVER = new THREE.MeshPhongMaterial({color: new THREE.Color(0x2ea44f), opacity: .8, transparent: true});
      const MAT_OUT = new THREE.MeshPhongMaterial({color: new THREE.Color(0x666666), opacity: .3, transparent: true});

      

      labels.map((o) => {
        const $label = document.createElement( 'div' );
        const name = document.createElement( 'div' );
        const power = document.createElement( 'div' );
        const voltage = document.createElement( 'div' );
        const electric_current = document.createElement( 'div' );
        const pressure = document.createElement( 'div' );
        const objectCSS = new CSS3DSprite( $label );
        
        $label.className = o.power > 5.5 ? 'label danger' : 'label';
        $label.setAttribute('target', o.uuid);

        $label.addEventListener( 'click', (event) => {
          event.stopPropagation();
          const html = $label.innerHTML;
          const siblings = $label.parentNode.children;
          for (let i = 0; i < siblings.length; i++) {
            siblings[i].className = siblings[i].className.replace(' selected', '');
          }
          $label.className = $label.className + ' selected';
          worldScene.traverse((child) => {
            if ( !child.isMesh ) return;
            if ( child.uuid === o.uuid ) child.material = MAT_OVER;
          });
          self.objectClickHandler(event, html, {x: o.center.x, y: o.center.y, z: o.center.z});
        }, false );

        $label.addEventListener( 'mouseover', (event) => {
          event.stopPropagation();
          worldScene.traverse((child) => {
            if ( !child.isMesh ) return;
            if ( child.uuid === o.uuid ) child.material = MAT_OVER;
          });
        }, false );

        $label.addEventListener( 'mouseleave', (event) => {
          event.stopPropagation();
          worldScene.traverse((child) => {
            if ( !child.isMesh ) return;
            if ( child.uuid === o.uuid ) child.material = MAT_OUT;
          });
        }, false );

        
        name.textContent = o.name;
        name.className = 'name';
        $label.appendChild(name);

        power.innerHTML = self.htmlWrpper('功率', o.power, 'Kw');
        power.className = 'item';
        $label.appendChild(power);

        voltage.innerHTML = self.htmlWrpper('电压', o.voltage, 'v');
        voltage.className = 'item';
        $label.appendChild(voltage);

        electric_current.innerHTML = self.htmlWrpper('电流', o.electric_current, 'A');
        electric_current.className = 'item';
        $label.appendChild(electric_current);

        pressure.innerHTML = self.htmlWrpper('压力', o.pressure, 'MPa');
        pressure.className = 'item';
        $label.appendChild(pressure);

        objectCSS.doubleSided = true;
        objectCSS.position.x = o.center.x;
        objectCSS.position.y = o.center.y;
        objectCSS.position.z = o.center.z;
        objectCSS.scale.set(0.02, 0.02, 0.02);
        group.add(objectCSS);
      });

      sceneCSS.add( group );
    },
    changePivot(x, y, z, obj){
      let wrapper = new THREE.Object3D();
          wrapper.position.set(-x, -y, -z);
          wrapper.add(obj);
          obj.position.set(x, y, z);
          return wrapper;
    },
    screenPointToThreeCoords(x, y, domContainer, camera, targetZ) {
      let vec = new THREE.Vector3(); // create once and reuse
      let pos = new THREE.Vector3(); // create once and reuse
      vec.set(
          ( x / domContainer.innerWidth ) * 2 - 1,
          - ( y / domContainer.innerHeight ) * 2 + 1,
          0.5 );
      vec.unproject( camera );
      vec.sub( camera.position ).normalize();
      let distance = (targetZ - camera.position.z) / vec.z;
      pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
      return pos;
    },
    htmlWrpper(label, val, unit) {
      return '<div>' + label +  ': </div><div class="v">' + val + unit + '</div>';
    },
    makeInfoPanel(content) {
      this.infoExpand = true;
      const dom = document.getElementById('windows');
      const infoPanel = document.createElement('div');
      infoPanel.className = 'panel';
      const charts = document.createElement('div');
      charts.setAttribute('id', 'infoCharts');
      const html = content;
      infoPanel.innerHTML = html;
      
      let child = dom.lastElementChild;
      while (child) { 
        dom.removeChild(child); 
        child = dom.lastElementChild; 
      }
      dom.appendChild(infoPanel);
      dom.appendChild(charts);
      const mypumpcharts = new PumpLineCharts({
        container: 'infoCharts'
      });
      mypumpcharts.create();
    },
    toggleInfoWindows() {
      this.infoExpand = !this.infoExpand;
    },
    objectClickHandler(e, html, newTarget) {
      orbitControls.update();
      const oldPosition = camera.position;
      const oldTarget = orbitControls.target;
      const newPosition = this.screenPointToThreeCoords(e.clientX, e.clientY, window, camera, 0);
      camera.lookAt(newPosition.x, newPosition.y, newPosition.z);
      this.animateCamera(oldPosition, oldTarget, newPosition, newTarget)
      this.makeInfoPanel(html)
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
        z2: oldT.z  // 控制点的中心点z
      };
      orbitControls.enabled = false;
      const tween = new TWEEN.Tween(object);
      tween.to({
        x1: newP.x,
        y1: newP.y,
        z1: newP.z,
        x2: newT.x,
        y2: newT.y,
        z2: newT.z
      },1000);
      tween.onUpdate(() => {
        camera.position.x = object.x1;
        camera.position.y = object.y1;
        camera.position.z = object.z1;
        orbitControls.target.x = object.x2;
        orbitControls.target.y = object.y2;
        orbitControls.target.z = object.z2;
        orbitControls.update();
      })
      tween.onComplete(() => {
        orbitControls.enabled = true;
        callBack&&callBack()
      })
      tween.easing(TWEEN.Easing.Cubic.InOut);
      tween.start();
    },
    loadModels(models) {
      let self = this;
      let numLoadedModels = 0;
      models.map((model) => {
        self.loadGltfModel(model, () => {
          ++ numLoadedModels;
          if ( numLoadedModels === models.length ) {
            self.makeLog( numLoadedModels + ' models loaded', 'info');
          }
        })
      })
    },
    loadGltfModel(model, onLoaded) {
      let loader;
      let uuids = [];
      const scale = 0.01;
      const self = this;
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });
      dracoLoader.preload();
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0xff0000), opacity: .6, transparent: true});
      const MAT_BUILDING_OPACITY_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0x666666), opacity: 。3, transparent: true});
      const loadStartTime = performance.now();
      const isFbx = model.name.indexOf('.fbx') > 0;
      if (isFbx) { 
        loader = new FBXLoader();
      } else {
        loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
      };
      loader.manager = loadingManager;
      loader.load( model.name, function (object) {
        self.makeLog('Load time: ' + ( performance.now() - loadStartTime ).toFixed( 2 ) + ' ms.', 'info');
        let scene;
        if (isFbx) { 
          scene = object;
        } else {
          scene = object.scene;
        };
        scene.scale.set(scale, scale, scale);
        scene.position.set(0, 0, 0);
        scene.traverse((child) => {
          if ( ! child.isMesh ) return;
          const isLabel = child.name.indexOf('真空表') >= 0 || child.name.indexOf('压力表') >= 0 || child.name.indexOf('电动蝶阀') >= 0;

          if (isLabel) {
            uuids.push({
              uuid: child.uuid, 
              name: child.name, 
              position: {x: child.position.x * scale, y: child.position.y * scale, z: child.position.z * scale}, 
              center: self.getCentroid(child)
            })

            child.material = MAT_BUILDING_TEXTURE;
          } else {
            child.material = MAT_BUILDING_OPACITY_TEXTURE;
          }
        });
        worldScene.add(scene);
        self.initLabels(uuids);
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
      this.makeLog('Error loading model: ' + xhr, 'error');
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


        const bWidth = ( x0 > x1 ) ? x0 - x1 : x1 - x0;
        const bHeight = ( y0 > y1 ) ? y0 - y1 : y1 - y0;
        const bDepth = ( z0 > z1 ) ? z0 - z1 : z1 - z0;

        const centroidX = x0 + ( bWidth / 2 ) + mesh.position.x;
        const centroidY = y0 + ( bHeight / 2 )+ mesh.position.y;
        const centroidZ = z0 + ( bDepth / 2 ) + mesh.position.z;

        return { x : centroidX * 0.01 - 3, y : centroidY * 0.01, z : centroidZ * 0.01 - 1 };

    },
    render() {
      requestAnimationFrame(this.render);
      orbitControls.update();
      camera.updateProjectionMatrix();
      renderer.render(worldScene, camera);
      rendererCSS.render(sceneCSS, camera);
      TWEEN.update();
      stats.update();
    },
    onWindowResize(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererCSS.setSize( window.innerWidth, window.innerHeight );
    },
    toggleInfoPanels(v) {
      this.panelExpand = v;
    },
    makeLog(msg, type) {
      switch (type) {
        case 'info':
          console.log('%c INFO => %c' + ' ' + msg, 'color: #fff; background: #41b882; padding: 3px 4px;', 'color: #41b882; background: #fff;');
          break;
        case 'error':
          console.log('%c ERROR => %c' + ' ' + msg, 'color: #fff; background: #f56c6c; padding: 3px 4px;', 'color: #f56c6c; background: #fff;');
          break;
        default:
          console.log('%c INFO => %c' + ' ' + msg, 'color: #fff; background: #41b882; padding: 3px 4px;', 'color: #41b882; background: #fff;');
      }
    }
  }
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
    width: 80px;
    height: 80px;
    opacity: .65;
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
      color:#41b882;
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
.echarts {
  width: 430px;
  max-height: 100%;
  padding: 10px;
  transform: translate(-380px, 0);
  overflow: auto;
  transition: transform .3s ease-out;

  &.expand {
    transform: translate(0, 0);
  }

  canvas {
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(0, 0, 0, .5);
  }
}

.label {
  width: 120px;
  background: rgba(0, 0, 0, .618);
  border: 1px solid rgba(0, 0, 0, .25);
  text-align: left;
  line-height: normal;
  padding: 10px;
  cursor: pointer;
  color: #efefef;
  transition: all .3s ease-out;
  position: relative;
  border-radius: 3px 3px 3px 0;

  &::before {
    display: block;
    content: '';
    position: absolute;
    left: -12px;
    bottom: -37px;
    height: 40px;
    border-left: 1px solid rgba(0, 0, 0, .85);
    transform: rotate(35deg);
  }

  &.danger {
    background: rgba(245, 108, 108, 0.87);
  }

  &.selected {
    background: rgba(46, 164, 79, 0.87);
  }

  &:hover {
    background: rgba(0, 0, 0, .86);
    box-shadow: 0px 0px 12px rgba(0, 0, 0, .5);
    border: 1px solid rgba(0, 0, 0, .75);
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


.info-windows {
  position: fixed;
  width: 430px;
  max-height: 100%;
  padding: 130px 10px 10px 60px;
  top: 0;
  right: -430px;
  overflow: auto;
  transition: all .3s ease-out;
  z-index: 10;

  .close-info-window {
    display: flex;
    position: absolute;
    top: 130px;
    left: 10px;
    overflow: hidden;
    z-index: 10000;
    background-color: rgba(255, 255, 255, .618);
    border-radius: 5px;
    box-shadow: 0 0 5px rgba(0, 0, 0, .5);
    padding: 0 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    transition: left .2s ease-out;

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
      opacity: .5;
      transition: opacity .3s ease-out;
    }
  }

  & .panel {
    width: 360px;
    height: auto;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(0, 0, 0, .5);
    background: rgba(255, 255, 255, .75);
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
    box-shadow: 0 0 6px rgba(0, 0, 0, .5);
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