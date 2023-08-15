<template>
  <div class="about" id="cesiumContainer">
    <div style="font-size: 60px">
      <VueJsCounter
        start="1900"
        end="1999999"
        duration="5000"
        thousand=","
        decimal=","
      ></VueJsCounter>
    </div>
    <div>
      <child :user="user"></child>
      <label for="user">parent：</label>
      <input id="user" type="text" v-model="user.name" />
    </div>
  </div>
</template>
<script>
import * as echarts from "echarts";
import "echarts-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import * as shapefile from "shapefile";
import axios from "axios";
import VueJsCounter from "vue-js-counter";
import Child from "./child.vue";

const ENCODE_SCALE = 1e6;
export default {
  data() {
    return {
      user: { name: "liuMang" },
    };
  },
  components: {
    VueJsCounter,
    Child,
  },
  mounted() {
    // console.log(mapboxgl)
    window.mapboxgl = mapboxgl;
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic29sYXJjZWxsc2t5IiwiYSI6ImNrbmFmOXVjdjExZ3oycnRhY3ZqNWJqNHcifQ.INN_v0VVzC2KNQVL-nvMLg";

    // this.init();
    this.initCesium();
  },
  methods: {
    decodeLine(line) {
      var result = [];
      var prevX = line[0];
      var prevY = line[1];

      for (var i = 0; i < line[2].length; i += 2) {
        var x = line[2].charCodeAt(i) - 64;
        var y = line[2].charCodeAt(i + 1) - 64;
        // ZigZag decoding
        x = (x >> 1) ^ -(x & 1);
        y = (y >> 1) ^ -(y & 1);
        // Delta deocding
        x += prevX;
        y += prevY;

        prevX = x;
        prevY = y;
        // Dequantize
        result.push([x / ENCODE_SCALE, y / ENCODE_SCALE, 10]);
      }

      return result;
    },
    initCesium() {
      const dataJSON = "./assets/temp/data-sh.json";

      let chart = echarts.init(document.getElementById("cesiumContainer"));
      chart.showLoading();
      axios
        .get(dataJSON)
        .then(function(response) {
          console.log(response);
          chart.setOption({
            visualMap: {
              show: false,
              calculable: true,
              realtime: false,
              inRange: {
                color: [
                  "#313695",
                  "#4575b4",
                  "#74add1",
                  "#abd9e9",
                  "#e0f3f8",
                  "#ffffbf",
                  "#fee090",
                  "#fdae61",
                  "#f46d43",
                  "#d73027",
                  "#a50026",
                ],
              },
              outOfRange: {
                colorAlpha: 0,
              },
              max: response.data[1],
            },
            mapbox: {
              center: [121.4693, 31.12307],
              zoom: 10,
              pitch: 50,
              bearing: -10,
              style: "mapbox://styles/mapbox/dark-v10",
              boxHeight: 50,
              // altitudeScale: 3e2,
              postEffect: {
                enable: true,
                SSAO: {
                  enable: true,
                  radius: 2,
                  intensity: 1.5,
                },
              },
              light: {
                main: {
                  intensity: 1,
                  shadow: true,
                  shadowQuality: "high",
                },
                ambient: {
                  intensity: 0,
                },
                ambientCubemap: {
                  texture: "./assets/temp/data-1491896094618-H1DmP-5px.hdr",
                  exposure: 1,
                  diffuseIntensity: 0.5,
                },
              },
            },
            series: [
              {
                type: "bar3D",
                shading: "realistic",
                coordinateSystem: "mapbox",
                barSize: 0.2,
                silent: true,
                data: response.data[0],
              },
            ],
          });
          chart.hideLoading();
        })
        .catch(function(error) {
          console.log(error);
        });
    },
    init() {
      let self = this;
      let geoJSON = {
        type: "FeatureCollection",
        features: [],
      };
      let regions = [
        {
          name: "1233",
          value: 1,
          height: 7.3659,
        },
      ];

      shapefile
        .open(
          "./assets/temp/data-1498751177695-rkzAeiGEb.shp",
          "./assets/temp/data-1498751184605-rJYAxjMVW.dbf"
        )
        .then((source) =>
          source.read().then(function append(result) {
            if (result.done) {
              return;
            }
            let feature = result.value;
            feature.properties.name = geoJSON.features.length + "";
            regions.push({
              name: geoJSON.features.length + "",
              value: 1,
              height: feature.properties.SHAPE_leng * 10000,
            });
            geoJSON.features.push(feature);
            return source.read().then(append);
          })
        );

      let chart = echarts.init(document.getElementById("cesiumContainer"));
      chart.showLoading();

      axios
        .get("/assets/temp/data-1498751206824-HkkgZsfEW.json")
        .then((response) => {
          const lines = response.data.map((track) => {
            return {
              coords: self.decodeLine(track),
              lineStyle: {},
            };
          });

          chart.hideLoading();

          echarts.registerMap("buildings", geoJSON);

          chart.setOption({
            mapbox: {
              center: [18.424552361777955, -33.92188144682616],
              zoom: 14,
              pitch: 50,
              bearing: -10,
              altitudeScale: 2,
              style: "mapbox://styles/mapbox/dark-v10",
              postEffect: {
                enable: true,
                screenSpaceAmbientOcclusion: {
                  enable: true,
                  intensity: 1.2,
                  radius: 6,
                  quality: "high",
                },
                screenSpaceReflection: {
                  enable: true,
                },
              },
              light: {
                main: {
                  intensity: 1,
                  shadow: true,
                  shadowQuality: "high",
                },
                ambient: {
                  intensity: 0,
                },
                ambientCubemap: {
                  texture: "./assets/temp/data-1491838644249-ry33I7YTe.hdr",
                  exposure: 1,
                  diffuseIntensity: 0.5,
                  specularIntensity: 2,
                },
              },
            },
            series: [
              {
                type: "lines3D",

                coordinateSystem: "mapbox",

                effect: {
                  show: true,
                  constantSpeed: 5,
                  trailWidth: 2,
                  trailLength: 0.8,
                  trailOpacity: 1,
                  spotIntensity: 10,
                },

                blendMode: "lighter",

                polyline: true,

                lineStyle: {
                  width: 0.1,
                  color: "rgb(200, 40, 0)",
                  opacity: 0,
                },

                data: lines,
              },
              {
                type: "map3D",
                map: "buildings",

                coordinateSystem: "mapbox",
                shading: "realistic",
                silent: true,

                instancing: true,

                data: regions,

                realisticMaterial: {
                  metalness: 1,
                  roughness: 0.2,
                },
              },
            ],
          });

          window.addEventListener("keydown", function() {
            chart.dispatchAction({
              type: "lines3DToggleEffect",
              seriesIndex: 0,
            });
          });
        });
    },
  },
};
</script>
<style>
.about {
  height: 100%;
  width: 100%;
}
</style>
