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
import SunCalc from "suncalc";
// THREE
import { ThreeJsCustomLayer } from "../components/ThreeJsCustomLayer.ts";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

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
    center: [116.39099673453211, 39.91199458907994],
    zoom: 13,
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
    style: "mapbox://styles/solarcellsky/cl25z7wpw000d15pif3n1i1z7",
    ...start,
    projection: "globe", // 为 3D 地球
    antialias: true, //抗锯齿，通过false关闭提升性能
    // scrollZoom: false,
    // doubleClickZoom: false,
    // keyboard: false,
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

    map.addLayer({
      id: "sky-layer",
      type: "sky",
      paint: {
        "sky-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0,
          5,
          0.3,
          8,
          1,
        ],
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": calculateSunPosition(null, map),
        "sky-atmosphere-sun-intensity": 5,
      },
    });

    const tt = [];

    map.on("click", (e) => {
      const ll = [e.lngLat.lng, e.lngLat.lat];
      tt.push(ll);
      console.log("e: ", tt);
    });

    addThree(map, [116.39099673453211, 39.91199458907994]);
  });
}

// 添加threejs
function addThree(map, origin) {
  /*
   *构造自定义ThreeJS图层
   * @param id 自定义图层ID
   * @param origin ThreeJS坐标原点经纬度
   * @param debug 是否开启调试
   */
  threeLayer = new ThreeJsCustomLayer(null, origin, false);

  const textureLoader = new THREE.TextureLoader();
  map.addLayer(threeLayer);

  textureLoader.load("./assets/images/line.png", (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 纹理垂直方向的平铺方式
    texture.repeat.set(1, 1); // 重复产生N个相同贴图 产生N行
    // 用代码创建一个朝下的半圆几何体数据，具体的参数可以查看Three.js的官方文档
    const geometry = new THREE.SphereBufferGeometry(
      888,
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
    sphere.name = "设置透明度值,只有开启了透明度这个值才好用";

    const cube_geometry = new THREE.SphereBufferGeometry(
      1666,
      360,
      90,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const cube_material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x00ffff,
      transparent: true, // 是否开启透明度
      opacity: 0.6,
      side: THREE.DoubleSide, // 正反面渲染
      minFilter: THREE.LinearFilter,
    });
    const cube = new THREE.Mesh(cube_geometry, cube_material);
    sphere.name = "颜色。如果设置了会叠加上面图片的颜色";

    threeLayer.addGeographicObject2Scene(
      sphere,
      [116.42435374354358, 39.961948732078355],
      "click"
    );
    // threeLayer.addGeographicObject2Scene(
    //   cube,
    //   [116.36269589347074, 39.91732362057715],
    //   "click"
    // );
  });

  textureLoader.load("./assets/images/line.png", (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //每个都重复
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;

    let material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
    });

    // 创建顶点数组
    const points = [
      new THREE.Vector3(-5932.770381264389, 0, 3400.1726401140913),
      new THREE.Vector3(-5563.002002422232, 0, 3222.5514522958547),
      new THREE.Vector3(-5267.772492737044, 0, 3092.2397064166144),
      new THREE.Vector3(-5059.839835971594, 0, 2984.1401571100578),
      new THREE.Vector3(-4921.801994824316, 0, 2900.1330266902223),
      new THREE.Vector3(-4687.805349919945, 0, 2794.8304275535047),
      new THREE.Vector3(-4493.402433058713, 0, 2724.821138017811),
      new THREE.Vector3(-4318.103352575563, 0, 2617.1124185984954),
      new THREE.Vector3(-4055.5566443982534, 0, 2487.161029830575),
      new THREE.Vector3(-3860.98052503448, 0, 2401.317364563234),
      new THREE.Vector3(-3605.0143264262006, 0, 2274.5904145129025),
      new THREE.Vector3(-3200.2212418662384, 0, 2068.903413211927),
      new THREE.Vector3(-2924.8161443616264, 0, 1948.2170011745766),
      new THREE.Vector3(-2612.166400678456, 0, 1803.8192166853696),
      new THREE.Vector3(-2371.4738132390194, 0, 1679.3307198360562),
      new THREE.Vector3(-1686.6836536685005, 0, 1329.4866926940158),
      new THREE.Vector3(-1542.5901883561164, 0, 1273.7795698447153),
      new THREE.Vector3(-945.521078763064, 0, 977.7543604960665),
      new THREE.Vector3(-613.0103414882906, 0, 807.6123739266768),
      new THREE.Vector3(-223.5521571165882, 0, 603.9473852058873),
      new THREE.Vector3(100.29602330597118, 0, 432.7931188410148),
      new THREE.Vector3(369.2699563219212, 0, 299.3227140940726),
      new THREE.Vector3(627.8178617032245, 0, 144.79882662091404),
      new THREE.Vector3(835.6624390776269, 0, 36.39013686683029),
      new THREE.Vector3(1126.385565802455, 0, -102.69328631367534),
      new THREE.Vector3(1435.0231249690987, 0, -271.66548873111606),
      new THREE.Vector3(1750.2230614107102, 0, -443.92597157880664),
      new THREE.Vector3(2146.213305959478, 0, -651.1067009586841),
      new THREE.Vector3(2402.031652391888, 0, -778.1994071127847),
      new THREE.Vector3(2631.958768299781, 0, -908.1765372613445),
      new THREE.Vector3(2835.295400848612, 0, -1009.2228384995833),
      new THREE.Vector3(3097.658319650218, 0, -1139.6191063299775),
      new THREE.Vector3(3390.744143500924, 0, -1290.552522746846),
      new THREE.Vector3(3666.209647710435, 0, -1427.5051013650373),
      new THREE.Vector3(3821.1759660332464, 0, -1494.0694914273918),
      new THREE.Vector3(4063.8330224258825, 0, -1614.7390799401328),
      new THREE.Vector3(4302.370875106659, 0, -1743.8665345283225),
      new THREE.Vector3(4529.847716993187, 0, -1862.2634296491742),
      new THREE.Vector3(4807.3321260800585, 0, -1995.0645773829892),
      new THREE.Vector3(5080.2966768704355, 0, -2120.392902581021),
      new THREE.Vector3(5349.148082565516, 0, -2254.1859395243227),
      new THREE.Vector3(5591.763033009134, 0, -2374.9401625255123),
      new THREE.Vector3(5844.594589926302, 0, -2474.5694014774635),
      new THREE.Vector3(6034.735194833949, 0, -2569.230962321162),
      new THREE.Vector3(6258.085345282685, 0, -2696.1762245828286),
      new THREE.Vector3(6360.947618340608, 0, -2752.643230462447),
    ];

    // CatmullRomCurve3创建一条平滑的三维样条曲线
    let curve = new THREE.CatmullRomCurve3(points); // 曲线路径

    // 创建管道
    let tubeGeometry = new THREE.TubeGeometry(curve, 80, 10);

    let mesh = new THREE.Mesh(tubeGeometry, material);

    threeLayer.addGeographicObject2Scene(mesh, null, null);
  });

  // const modelLoader = new GLTFLoader();
  // modelLoader.load("./assets/models/elephant.glb", (result) => {
  //   const model = result.scene;
  //   model.scale.setScalar(500);
  //   threeLayer.addObject3D2Scene(model, [116.425325, 39.899659], "click");
  // });

  const fbxLoader = new FBXLoader();
  fbxLoader.load("./assets/models/shanghai.fbx", (result) => {
    const model = result;
    // model.scale.setScalar(1);
    threeLayer.addObject3D2Scene(result, [116.425325, 39.899659], "click");
  });
}

function calculateSunPosition(date, map) {
  const center = map.getCenter();
  const sunPos = SunCalc.getPosition(
    date || Date.now(),
    center.lat,
    center.lng
  );
  const sunAzimuth = 180 + (sunPos.azimuth * 180) / Math.PI;
  const sunAltitude = 90 - (sunPos.altitude * 180) / Math.PI;
  return [sunAzimuth, sunAltitude];
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
