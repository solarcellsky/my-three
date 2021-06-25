<template>
  <div id="mapView"></div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as THREE from "three";
import * as geolib from 'geolib';

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
const worldScene = new THREE.Scene();
const center = [116.48487986503507, 39.925106588670836]
const frustumSize = 600;

export default {
  name: "ThreeMap",
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      let self = this;
      mapboxgl.accessToken = 'pk.eyJ1Ijoic29sYXJjZWxsc2t5IiwiYSI6ImNrbmFmOXVjdjExZ3oycnRhY3ZqNWJqNHcifQ.INN_v0VVzC2KNQVL-nvMLg';
      let map = new mapboxgl.Map({
        container: "mapView",
        //为 map 构造一个空 style
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf"
        },
        style: 'mapbox://styles/mapbox/dark-v10',
        // 地图初始中心经纬度
        center: center,
        // 地图初始缩放级别
        zoom: 10,
        pitch: 45,
        bearing: -120,
        minZoom: 3
      });

      window.map = map;
      // console.log(window.renderer)

      let customLayer = {
        id: 'Mapbox-Three-Dubble',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function(map, gl) {
          //用mapbox-gl里的添加Webgl方法添加Threejs创建的3D模型
          window.renderer = new THREE.WebGLRenderer({
              canvas: map.getCanvas(),
              context: gl,
              antialias: true, //抗锯齿开启
              preserveDrawingBuffer: true //开启预渲染缓存
          });
          //场景自动刷新
          window.renderer.autoClear = false;
          window.renderer.setPixelRatio(window.devicePixelRatio);
          window.renderer.setSize( window.innerWidth, window.innerHeight );
          window.renderer.shadowMap.Enabled = true;
          window.renderer.outputEncoding = THREE.LinearEncoding;
          window.renderer.shadowMap.enabled = true;
          window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          camera.position.set( 300, 100, 800 );
          camera.lookAt(new THREE.Vector3(0, 0, 0));

          const cameraPerspectiveHelper = new THREE.CameraHelper( camera );
          worldScene.add( cameraPerspectiveHelper );

          const aspect = window.innerWidth / window.innerHeight
          const cameraOrtho = new THREE.OrthographicCamera( 0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 150, 1000 );

          const cameraOrthoHelper = new THREE.CameraHelper( cameraOrtho );
          worldScene.add( cameraOrthoHelper );

          worldScene.add(new THREE.AxesHelper(1000));
          const gridHelper = new THREE.GridHelper(600, 160, new THREE.Color(0xf56c6c), new THREE.Color(0x409eff))

          // const gridHelper = new THREE.GridHelper( 10000, 80, 0xf56c6c, 0x409eff );
          gridHelper.position.y = -5;
          gridHelper.material.opacity = 0.65;
          gridHelper.material.transparent = true;
          worldScene.add( gridHelper );
          self.GetGeoJson('./assets/streets.json');

        },
        render: function(gl, matrix) {
          self.animate();
          map.triggerRepaint();
        }
      }
      map.on('load', function(){
        // map.addSource('maine', {
        //   type: 'geojson',
        //   data: './assets/streets.json'
        // });
        // map.addLayer({
        //     'id': 'maine',
        //     'type': 'fill',
        //     'source': 'maine',
        //     'layout': {},
        //     'paint': {
        //     'fill-color': '#088',
        //     'fill-opacity': 0.8
        //   }
        // });
        map.addLayer(customLayer);
        console.log(window.renderer)
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
        const edgesMtl =  new THREE.LineBasicMaterial({color: new THREE.Color(0x100000)});
        const geometryLine = new THREE.LineSegments(geometryEdges, edgesMtl);

        let mesh = new THREE.Mesh(geometry, height ? MAT_BUILDING_TEXTURE : MAT_BUILDING);
        mesh.userData.properties = info;
        worldScene.add(mesh)
        worldScene.add(geometryLine);
        if (height) {
          // this.bindSceneEvent(mesh)
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
    animate() {
      requestAnimationFrame(this.animate);
      // worldScene.rotation.y += 0.002;
      window.renderer.render(worldScene, camera);
    },
  }
};
</script>

<style scoped>
#mapView {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
}
</style>
