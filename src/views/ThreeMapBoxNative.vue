<template>
  <div class="w100 h100" style="position: relative">
    <div ref="basicMapbox" style="position: relative" class="w100 h100"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
// mapboxgl地图
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// THREE
import { ThreeJsCustomLayer } from "../components/ThreeJsCustomLayer.ts";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let map, // 地图
  threeLayer;

// 初始化生命周期
onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(requestAnimationFrameIndex);
  // // 释放显存
  map = null;
  threeLayer = null;
});

const basicMapbox = ref(null),
  start = {
    center: [110.396467, 35.907173],
    zoom: 1,
    pitch: 0,
    bearing: 0,
  },
  end = {
    center: [116.396467, 39.907173],
    zoom: 14,
    bearing: 20, //目标方位角
    pitch: 60,
  };

const blankMapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "rgba(255,255,255,0)",
      },
    },
  ],
};

// 初始化函数
function init() {
  mapboxgl.accessToken =
    "pk.eyJ1Ijoic29sYXJjZWxsc2t5IiwiYSI6ImNrbmFmOXVjdjExZ3oycnRhY3ZqNWJqNHcifQ.INN_v0VVzC2KNQVL-nvMLg";
  map = new mapboxgl.Map({
    container: basicMapbox.value,
    style: "mapbox://styles/mapbox/dark-v10",
    ...start,
    projection: "globe", // 为 3D 地球
    antialias: true, //抗锯齿，通过false关闭提升性能
    scrollZoom: false,
    doubleClickZoom: false,
    keyboard: false,
  });
  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  map.on("style.load", () => {
    map.setFog({
      color: "rgb(186, 210, 235)", // Lower atmosphere
      "high-color": "rgb(36, 92, 223)", // Upper atmosphere
      "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
      "space-color": "rgb(11, 11, 25)", // Background color
      "star-intensity": 0.6, // Background star brightness (default 0.35 at low zoooms )
    });
    map.flyTo({
      ...end,
      duration: 5000,
      essential: true,
    });

    addThree(map);
  });
}

// 添加threejs
function addThree(map) {
  threeLayer = new ThreeJsCustomLayer(null, false);

  const textureLoader = new THREE.TextureLoader();
  map.addLayer(threeLayer);
  textureLoader.load("./assets/images/r.png", (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 纹理垂直方向的平铺方式
    texture.repeat.set(1, 1); // 重复产生N个相同贴图 产生N行
    // 用代码创建一个朝下的半圆几何体数据，具体的参数可以查看Three.js的官方文档
    const geometry = new THREE.SphereBufferGeometry(
      600,
      360,
      90,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    // 创建基础材质
    const sphere_material = new THREE.MeshBasicMaterial({
      map: texture, // 图片。可以没有那就是纯色
      // color: 0xa4ffdc, // 颜色。如果设置了会叠加上面图片的颜色
      transparent: true, // 是否开启透明度
      opacity: 0.618, // 设置透明度值,只有开启了透明度这个值才好用
      side: THREE.DoubleSide, // 正反面渲染
      minFilter: THREE.LinearFilter,
    });
    // 创建实体
    const sphere = new THREE.Mesh(geometry, sphere_material);
    console.log("sphere: ", sphere);

    const cube_geometry = new THREE.SphereBufferGeometry(
      888,
      360,
      90,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const cube_material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xff0000,
      transparent: true, // 是否开启透明度
      opacity: 0.6,
      side: THREE.DoubleSide, // 正反面渲染
      minFilter: THREE.LinearFilter,
    });
    const cube = new THREE.Mesh(cube_geometry, cube_material);
    // const xyz = getMercator([116.426403, 39.913524]);
    threeLayer.addGeographicObject2Scene(sphere);
    threeLayer.addGeographicObject2Scene(cube);
  });

  const modelLoader = new GLTFLoader();
  modelLoader.load("./assets/models/elephant.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(500);
    threeLayer.addObject3D2Scene(model, [116.426403, 39.913524]);
  });
}

/**
 * 经纬度转墨卡托xyz
 * @param lngLat 经纬度
 */
function getMercator(lngLat) {
  const mercator = {};
  // 地球半径(米)
  const earthRad = 6378137.0;
  mercator.x = ((lngLat[0] * Math.PI) / 180) * earthRad;
  const local_array = (lngLat[1] * Math.PI) / 180;
  mercator.y =
    (earthRad / 2) *
    Math.log((1.0 + Math.sin(local_array)) / (1.0 - Math.sin(local_array)));
  mercator.z = 0;
  return mercator;
}
</script>

<style>
.mapboxgl-ctrl-bottom-left,
.mapboxgl-ctrl-bottom-right {
  display: none;
}
.mapboxgl-ctrl-icon {
  box-sizing: border-box;
}
.h100 {
  height: 100vh;
}
.w100 {
  width: 100vw;
}
</style>
