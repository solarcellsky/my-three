<template>
  <div id="mapView">
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
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as THREE from "three";
import * as TWEEN from "tween.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import * as geolib from "geolib";
import { shader as depthVertexShader } from "./shaders/depth-vs.js";
import { shader as depthFragmentShader } from "./shaders/depth-fs.js";
import { shader as shieldVertexShader } from "./shaders/shield-vs.js";
import { shader as shieldFragmentShader } from "./shaders/shield-fs.js";

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  3000
);
const worldScene = new THREE.Scene();
const center = [116.48487986503507, 39.925106588670836];
const frustumSize = 600;

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

export default {
  name: "ThreeMap",
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      let self = this;
      mapboxgl.accessToken =
        "pk.eyJ1Ijoic29sYXJjZWxsc2t5IiwiYSI6ImNrbmFmOXVjdjExZ3oycnRhY3ZqNWJqNHcifQ.INN_v0VVzC2KNQVL-nvMLg";
      const dom = document.getElementById("mapView");
      const stats = new Stats();
      dom.appendChild(stats.dom);

      window.stats = stats;

      let map = new mapboxgl.Map({
        container: "mapView",
        //为 map 构造一个空 style
        style: "mapbox://styles/mapbox/dark-v10",
        // 地图初始中心经纬度
        center: center,
        // 地图初始缩放级别
        zoom: 10,
        pitch: 45,
        bearing: -120,
        minZoom: 3,
      });

      window.map = map;

      let customLayer = {
        id: "Mapbox-Three-Dubble",
        type: "custom",
        renderingMode: "3d",
        onAdd: function(map, gl) {
          //用mapbox-gl里的添加Webgl方法添加Threejs创建的3D模型
          window.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true, //抗锯齿开启
            preserveDrawingBuffer: true, //开启预渲染缓存
          });
          //场景自动刷新
          window.renderer.autoClear = false;
          window.renderer.setPixelRatio(window.devicePixelRatio);
          window.renderer.setSize(window.innerWidth, window.innerHeight);
          window.renderer.shadowMap.Enabled = true;
          window.renderer.outputEncoding = THREE.LinearEncoding;
          window.renderer.shadowMap.enabled = true;
          window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          camera.position.set(300, 100, 800);
          camera.lookAt(new THREE.Vector3(0, 0, 0));

          const cameraPerspectiveHelper = new THREE.CameraHelper(camera);
          worldScene.add(cameraPerspectiveHelper);

          const aspect = window.innerWidth / window.innerHeight;
          const cameraOrtho = new THREE.OrthographicCamera(
            (0.5 * frustumSize * aspect) / -2,
            (0.5 * frustumSize * aspect) / 2,
            frustumSize / 2,
            frustumSize / -2,
            150,
            1000
          );

          const cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);
          worldScene.add(cameraOrthoHelper);

          worldScene.add(new THREE.AxesHelper(1000));
          const gridHelper = new THREE.GridHelper(
            600,
            160,
            new THREE.Color(0xf56c6c),
            new THREE.Color(0x409eff)
          );

          // const gridHelper = new THREE.GridHelper( 10000, 80, 0xf56c6c, 0x409eff );
          gridHelper.position.y = -5;
          gridHelper.material.opacity = 0.65;
          gridHelper.material.transparent = true;
          // worldScene.add(gridHelper);

          const textureLoader = new THREE.TextureLoader();
          const shield_texture = textureLoader.load("./assets/images/m.png");
          shield_texture.wrapS = shield_texture.wrapT = THREE.RepeatWrapping;
          // const shieldGeometry = new THREE.SphereBufferGeometry(10, 100, 100);
          // const shieldMaterial = new THREE.RawShaderMaterial({
          //   uniforms: {
          //     depthBuffer: { value: null },
          //     resolution: { value: new THREE.Vector2(1, 1) },
          //     bufColor: { value: null },
          //     u_tex: { value: null },
          //     time: { value: 0 },
          //   },
          //   vertexShader: shieldVertexShader,
          //   fragmentShader: shieldFragmentShader,
          //   transparent: true,
          //   depthWrite: false,
          //   side: THREE.DoubleSide,
          // });

          shield_texture.repeat.set(1, 1); // 重复产生N个相同贴图 产生N行
          // 用代码创建一个朝下的半圆几何体数据，具体的参数可以查看Three.js的官方文档
          const geometry = new THREE.SphereGeometry(
            150,
            360,
            100,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
          );
          // 创建基础材质
          const material = new THREE.MeshBasicMaterial({
            map: shield_texture, // 图片。可以没有那就是纯色
            //color: 0xffff00, // 颜色。如果设置了会叠加上面图片的颜色
            transparent: true, // 是否开启透明度
            opacity: 0.6, // 设置透明度值,只有开启了透明度这个值才好用
            side: THREE.DoubleSide, // 正反面渲染
          });
          // 创建实体
          const sphere = new THREE.Mesh(geometry, material);
          window.sphereMaterial = material;
          worldScene.add(sphere);
          // const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
          // shield.position.set(0, 0, 0);
          // shield.material.uniforms.depthBuffer.value = depth.texture;
          // shield.material.uniforms.bufColor.value = depth.texture;
          // shield.material.uniforms.u_tex.value = shield_texture;
          // shield.visible = true;
          // worldScene.add(shield);
          // console.log("worldScene: ", worldScene);

          // self.GetGeoJson("./assets/temp/streets.json");
        },
        render: function(gl, matrix) {
          self.animate();
          map.triggerRepaint();
        },
      };
      //
      const progressBar = document.getElementById("progressBar");
      map.on("sourcedata", function() {
        const layers = map.getStyle().layers;
        layers.map((layer) => {
          if (layer.id.indexOf("-label") >= 0) {
            map.removeLayer(layer.id);
          }
        });
      });
      map.on("load", function() {
        progressBar.style.opacity = 0;
        map.addLayer(customLayer, "building");
      });
      map.on("render", function() {
        setTimeout(() => {
          progressBar.style.zIndex = -1;
        }, 500);
      });
    },
    GetGeoJson(api) {
      let self = this;

      fetch(api).then((res) => {
        res.json().then((data) => {
          self.LoadBuildings(data);
        });
      });
    },

    LoadBuildings(data) {
      let features = data.features;

      for (let i = 0; i < features.length; i++) {
        let fel = features[i];
        if (!fel["properties"]) return;

        if (fel.properties["building"]) {
          this.addBuilding(
            fel.geometry.coordinates,
            fel.properties,
            fel.properties["building:levels"]
          );
        } else {
          this.addBuilding(fel.geometry.coordinates, fel.properties, null);
        }
      }
    },

    addBuilding(data, info, height) {
      const texture = new THREE.TextureLoader().load(
        "./assets/textures/glass.jpg"
      );
      const MAT_BUILDING = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x666666),
      });
      const MAT_BUILDING_TEXTURE = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x409eff),
      });
      for (let i = 0; i < data.length; i++) {
        let el = data[i];

        let shape = this.genShape(el, center);
        let geometry = this.genGeometry(shape, {
          curveSegments: 1,
          depth: height ? 0.6 * height : 0.5,
          bevelEnabled: false,
        });

        geometry.rotateX(Math.PI / 2);
        geometry.rotateZ(Math.PI);

        const geometryEdges = new THREE.EdgesGeometry(geometry, 1);
        const edgesMtl = new THREE.LineBasicMaterial({
          color: new THREE.Color(0x100000),
        });
        const geometryLine = new THREE.LineSegments(geometryEdges, edgesMtl);

        let mesh = new THREE.Mesh(
          geometry,
          height ? MAT_BUILDING_TEXTURE : MAT_BUILDING
        );
        mesh.userData.properties = info;
        worldScene.add(mesh);
        worldScene.add(geometryLine);
        if (height) {
          // this.bindSceneEvent(mesh)
        }
      }
    },

    addField() {
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
    },

    genShape(points, center) {
      let shape = new THREE.Shape();

      for (let i = 0; i < points.length; i++) {
        let elp = points[i];
        elp = this.GPSRelativePosition(elp, center);

        if (i == 0) {
          shape.moveTo(elp[0], elp[1]);
        } else {
          shape.lineTo(elp[0], elp[1]);
        }
      }

      return shape;
    },

    genGeometry(shape, settings) {
      let geometry = new THREE.ExtrudeBufferGeometry(shape, settings);
      geometry.computeBoundingBox();

      return geometry;
    },
    GPSRelativePosition(objPosi, centerPosi) {
      // Get GPS distance
      let dis = geolib.getDistance(objPosi, centerPosi);

      // Get bearing angle
      let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi);

      // Calculate X by centerPosi.x + distance * cos(rad)
      let x = centerPosi[0] + dis * Math.cos((bearing * Math.PI) / 180);

      // Calculate Y by centerPosi.y + distance * sin(rad)
      let y = centerPosi[1] + dis * Math.sin((bearing * Math.PI) / 180);

      // Reverse X (it work)
      return [-x / 100, y / 100];
    },
    animate() {
      // requestAnimationFrame(this.animate);
      window.renderer.render(worldScene, camera);
      window.renderer.setAnimationLoop(this.animate);
      TWEEN.update();
      window.stats.update();
      // worldScene.rotation.y += 0.002;
      window.sphereMaterial.map.offset.y += 0.01;
    },
  },
};
</script>

<style lang="scss" scoped>
#mapView {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
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
    color: #efefef;
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
</style>
