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
// mapboxgl汉化
// THREE
import * as THREE from "three";
// 加载器
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// label标签
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer";

let map, // 地图
  renderer, //  WebGLRenderer渲染器
  scene, // 场景
  camera; // 相机

// 初始化生命周期
onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(requestAnimationFrameIndex);
  // 释放显存
  renderer?.dispose();
  scene = null;
  map = null;
});

const basicMapbox = ref(null),
  start = {
    center: [80, 80],
    zoom: 1,
    pitch: 0,
    bearing: 0,
  },
  end = {
    center: [118.72791630249077, 32.00910104313064],
    zoom: 17,
    bearing: 60, //目标方位角
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
  map.addControl(new mapboxgl.NavigationControl(), "top-left");
  // 添加threejs
  addThree();
}

// 添加threejs
function addThree() {
  // 确保模型在地图上正确地理参照的参数
  const modelOrigin = [118.72791630249077, 32.00910104313064],
    modelAltitude = 0,
    modelRotate = [Math.PI / 2, 0, 0],
    modelScale = 5.41843220338983e-8;

  // 用于在地图上定位、旋转和缩放三维模型的变换参数
  const modelTransform = {
    translateX: mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    ).x,
    translateY: mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    ).y,
    translateZ: mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    ).z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /*由于我们的3D模型是以真实世界的米为单位的，因此需要进行比例变换
     *应用，因为CustomLayerInterface需要墨卡托坐标中的单位。
     */
    // scale: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).meterInMercatorCoordinateUnits(),
    scale: modelScale,
  };

  // 根据CustomLayerInterface为三维模型配置自定义层
  const customLayer = {
    id: "3dmodel",
    type: "custom",
    renderingMode: "3d",
    onAdd: function(map, gl) {
      // 场景
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog("#ffffff", 20, 500);
      // scene.add(Object3D);
      // 相机
      camera = new THREE.PerspectiveCamera(
        45,
        basicMapbox.value.offsetWidth / basicMapbox.value.offsetHeight,
        1,
        2000
      );

      // 使用Mapbox GL JS地图画布,添加 `THREE.WebGLRenderer`
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        alpha: true,
        antialias: true,
      });
      // renderer.shadowMap.enabled = true;
      // 定义渲染器是否在渲染每一帧之前自动清除其输出。
      renderer.autoClear = false;
      // 自然光
      scene.add(new THREE.AmbientLight("#ffffff", 1));
      // 加载器
      // loaderFn();
    },
    render: function(gl, matrix) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      // camera.projectionMatrix.elements = matrix;
      // camera.projectionMatrix = m.multiply(l);
      renderer?.render(scene, camera);

      // 必须调用该函数更新视图
      map?.triggerRepaint();
    },
  };

  map.on("style.load", function() {
    map.setFog({});
    map.flyTo({
      ...end,
      duration: 10000,
      essential: true,
    });
    map.addLayer(customLayer);
  });
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
