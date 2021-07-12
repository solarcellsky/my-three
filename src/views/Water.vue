<template>
<div class="container" id="container">
  <div class="gl" id="gl"></div>
  <div id="echarts" :class="panelExpand ? 'echarts expand' : 'echarts'"></div>
  <Hamburg @toggleInfoPanels="toggleInfoPanels" />
  <div id="infoWindows" :class=" infoExpand ? 'info-windows right' : 'info-windows'">
    <div class="close-info-window" @click="toggleInfoWindows">
      <img src="assets/close.svg" alt="">
    </div>
    <div id="windows"></div>
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import Compass from "../components/common/scene/Compass";
import ArrowFlow from "../components/common/scene/ArrowFlow";
import AnimateLine from "../components/common/scene/AnimateLine";
import PumpLineCharts from "../components/common/echarts/PumpLineCharts";
import PumpTensionLineCharts from "../components/common/echarts/PumpTensionLineCharts";
import LowTensionLineCharts from "../components/common/echarts/LowTensionLineCharts";
import HighTensionLineCharts from "../components/common/echarts/HighTensionLineCharts";
import Hamburg from '../components/common/ui/Hamburg'


export default {
  components: {
    Hamburg
  },
  data() {
    return {
      panelExpand: true,
      infoExpand: false,
      models: [
        { name: 'assets/water.gltf', position: { x: 0, y: 0, z: 0 } }
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
      camera.position.set( 200, 60, 200 );
      camera.lookAt( 0, 0, 0 );

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
      // container.appendChild( stats.dom );

      // orbit controls
      const orbitControls = new OrbitControls( camera, rendererCSS.domElement );
      orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      orbitControls.dampingFactor = 0.25;
      orbitControls.screenSpacePanning = false;
      orbitControls.minPolarAngle = Math.PI / 3;
      orbitControls.maxPolarAngle = Math.PI / 2.3;
      orbitControls.maxDistance = 400;
      orbitControls.minDistance = 50;
      // orbitControls.autoRotate = true;
      orbitControls.autoRotateSpeed = 0.08;
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
      }

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
      this.initLabels();

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

      tubeOptions.map((option) => {
        const tube = new ArrowFlow(option, worldScene);
        tube.create()
      })

      alineOptins.map((option) => {
        const aline = new AnimateLine(option, worldScene);
        aline.create()
      })
    },
    initLabels() {
      let self = this;
      let bumps = [];
      const group = new THREE.Group();

      for (let i = 0; i < 10; i++) {
        bumps.push({
          id: i,
          name: '加压泵#' + (i + 1),
          power: (Math.random() + 5).toFixed(2),
          voltage: (Math.random() + 380).toFixed(2),
          electric_current: (Math.random() + 10).toFixed(2),
          pressure: Math.random().toFixed(2)
        })
      }

      const MAT_OVER = new THREE.MeshPhongMaterial({color: new THREE.Color(0xff0000), opacity: .3, transparent: true});
      const MAT_OUT = new THREE.MeshPhongMaterial({color: new THREE.Color(0x666666), opacity: .3, transparent: true});
      // const BUILDINGS_TEXTURE = new THREE.TextureLoader().load("assets/campusalbano/A2_40_V_010000_ao_BaseColor.jpg");
      // const MAT = new THREE.MeshBasicMaterial({
      //   color: new THREE.Color(0xffffff),
      //   map: BUILDINGS_TEXTURE,
      //   transparent: true,
      //   side: THREE.DoubleSide
      // });

      bumps.map((o) => {
        const element = document.createElement( 'div' );
        element.className = o.power > 5.5 ? 'element danger' : 'element';
        element.addEventListener( 'click', (event) => {
          event.stopPropagation();
          const html = element.innerHTML;
          self.objectClickHandler(event, html);
        }, false );

        element.addEventListener( 'mouseover', (event) => {
          event.stopPropagation();
          worldScene.traverse((child) => {
            if ( !child.isMesh ) return;
            child.material = MAT_OVER;
          });
        }, false );

        element.addEventListener( 'mouseleave', (event) => {
          event.stopPropagation();
          worldScene.traverse((child) => {
            if ( !child.isMesh ) return;
            child.material = MAT_OUT;
          });
        }, false );

        const name = document.createElement( 'div' );
        name.textContent = o.name;
        name.className = 'name';
        element.appendChild(name);

        const power = document.createElement( 'div' );
        power.innerHTML = self.htmlWrpper('功率', o.power, 'Kw');
        power.className = 'item';
        element.appendChild(power);

        const voltage = document.createElement( 'div' );
        voltage.innerHTML = self.htmlWrpper('电压', o.voltage, 'v');
        voltage.className = 'item';
        element.appendChild(voltage);

        const electric_current = document.createElement( 'div' );
        electric_current.innerHTML = self.htmlWrpper('电流', o.electric_current, 'A');
        electric_current.className = 'item';
        element.appendChild(electric_current);

        const pressure = document.createElement( 'div' );
        pressure.innerHTML = self.htmlWrpper('压力', o.pressure, 'MPa');
        pressure.className = 'item';
        element.appendChild(pressure);

        const objectCSS = new CSS3DObject( element );
        objectCSS.doubleSided = true;
        objectCSS.position.x = Math.random() * 100 - Math.random() * 100;
        objectCSS.position.y = 0;
        objectCSS.position.z = Math.random() * 100 - Math.random() * 100;
        objectCSS.scale.set(0.05, 0.05, 0.05);

        group.add(objectCSS);
      })

      sceneCSS.add( group );
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
    objectClickHandler(e, html) {
      this.makeInfoPanel(html)
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
      const loadStartTime = performance.now();
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({color: new THREE.Color(0x666666), opacity: .3, transparent: true});
      dracoLoader.setDecoderPath( 'assets/draco/' );
      dracoLoader.setDecoderConfig({ type: 'js' });
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.manager = loadingManager;
      loader.load( model.name, function (gltf) {
        console.info( 'Load time: ' + ( performance.now() - loadStartTime ).toFixed( 2 ) + ' ms.' );
        let scene = gltf.scene;
        scene.scale.set(0.005, 0.005, 0.005);
        scene.position.set(-30, 5, -30);
        scene.traverse((child) => {
          if ( ! child.isMesh ) return;
          child.material = MAT_BUILDING_TEXTURE;
        });
        worldScene.add(scene)
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
    render() {
      requestAnimationFrame(this.render);
      orbitControls.update();
      camera.updateProjectionMatrix();
      renderer.render(worldScene, camera);
      rendererCSS.render(sceneCSS, camera);
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
.echarts {
  width: 430px;
  height: 100%;
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

.element {
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

  &::before {
    display: block;
    content: '';
    position: absolute;
    left: -1px;
    bottom: -19px;
    height: 20px;
    border-left: 1px solid rgba(0, 0, 0, .85);
    transform: rotate(45deg);
  }

  &.danger {
    background: rgba(245, 108, 108, 0.87);
  }

  &:hover {
    background: rgba(0, 0, 0, .88);
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