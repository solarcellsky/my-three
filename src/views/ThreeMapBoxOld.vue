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
import * as THREE from "three";

let map, // 地图
  renderer, //  WebGLRenderer渲染器
  scene, // 场景 // 材质
  camera;

// 初始化生命周期
onMounted(() => {
  init();
});
onBeforeUnmount(() => {
  cancelAnimationFrame(requestAnimationFrameIndex);
  // // 释放显存
  renderer?.dispose();
  map = null;
  camera = null;
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
  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  map.on("style.load", function () {
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
    addThreeOld(map);
  });
}

function addThreeOld(myMap) {
  // 根据CustomLayerInterface为三维模型配置自定义层
  const customLayer = {
    id: "3dmodel",
    type: "custom",
    renderingMode: "3d",
    onAdd: (map, gl) => {
      const _center = mapboxgl.MercatorCoordinate.fromLngLat(
        map.getCenter(),
        0
      );

      // 场景
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog("#ffffff", 20, 500);

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
      renderer.shadowMap.enabled = true;
      // 定义渲染器是否在渲染每一帧之前自动清除其输出。
      renderer.autoClear = false;
      // 自然光
      scene.add(new THREE.AmbientLight("#ffffff", 1));

      const light = new THREE.DirectionalLight(0xffffff);
      light.position.set(-2, 2, 0.5);
      light.castShadow = true;
      light.shadow.camera.top = 2;
      light.shadow.camera.bottom = -2;
      light.shadow.camera.right = 2;
      light.shadow.camera.left = -2;
      light.shadow.bias = -0.00001;
      light.shadow.mapSize.set(4096, 4096);
      scene.add(light);
      // light helper
      scene.add(new THREE.DirectionalLightHelper(light, 2, 0xffff00));
      // axis helper
      scene.add(new THREE.AxesHelper(10000000));

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load("./assets/images/m.png", (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 纹理垂直方向的平铺方式
        texture.repeat.set(1, 1); // 重复产生N个相同贴图 产生N行
        // 用代码创建一个朝下的半圆几何体数据，具体的参数可以查看Three.js的官方文档
        const geometry = new THREE.SphereBufferGeometry(
          1000,
          360,
          100,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2
        );
        // 创建基础材质
        const sphere_material = new THREE.MeshBasicMaterial({
          map: texture, // 图片。可以没有那就是纯色
          // color: 0x0000ff, // 颜色。如果设置了会叠加上面图片的颜色
          transparent: true, // 是否开启透明度
          opacity: 0.3, // 设置透明度值,只有开启了透明度这个值才好用
          side: THREE.DoubleSide, // 正反面渲染
          minFilter: THREE.LinearFilter,
        });
        // 创建实体
        const sphere = new THREE.Mesh(geometry, sphere_material);
        scene.add(sphere);

        const cube_geometry = new THREE.BoxGeometry(100, 100, 100);
        const cube_material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cube_geometry, cube_material);
        scene.add(cube);
      });
    },
    render: (gl, matrix) => {
      const lngLat = [116.396467, 39.907173];
      // 确保模型在地图上正确地理参照的参数
      const modelOrigin = lngLat,
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

      camera.projectionMatrix.elements = matrix;
      camera.projectionMatrix = m.multiply(l);
      renderer?.render(scene, camera);
      sphere_material.map.offset.y += 0.01;
      // 必须调用该函数更新视图
      map?.triggerRepaint();
    },
  };

  myMap.addLayer(customLayer);
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
