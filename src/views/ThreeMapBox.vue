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
import * as dat from "dat.gui";

import * as THREE from "three";
import CityClass from "../three/city";

let map;

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
    zoom: 13,
    bearing: 30, //目标方位角
    pitch: 75,
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
  });
  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  map.on("sourcedata", function () {
    const layers = map.getStyle().layers;
    layers.map((layer) => {
      if (layer.id.indexOf("-label") >= 0) {
        map.removeLayer(layer.id);
      }
    });
  });

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
  const canvas = map.getCanvas();

  // Scene
  const scene = new THREE.Scene();

  /**
   * Textures
   */
  const textureLoader = new THREE.TextureLoader();

  /**
   * Light
   */
  const light = new THREE.AmbientLight(0xadadad); // soft white light
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(100, 100, 0);
  scene.add(directionalLight);

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    1,
    10000
  );
  camera.position.set(1200, 700, 121);
  scene.add(camera);

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(new THREE.Color("#32373E"), 1);

  // City
  const city = new CityClass({});
  scene.add(city.group);

  /**
   * Animate
   */
  const clock = new THREE.Clock();

  const tick = () => {
    const dt = clock.getDelta();

    city.animate(dt);

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };

  tick();
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
