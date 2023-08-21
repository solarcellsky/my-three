<template>
  <div id="container"></div>
</template>

<script lang="ts">
import * as THREE from "three";
import * as dat from "dat.gui";
import { onMounted } from "vue";

const gui = new dat.GUI();

const palette = {
  color1: "#FF0000", // CSS string
  color2: [0, 128, 255], // RGB array
  color3: [0, 128, 255, 0.3], // RGB with alpha
  color4: { h: 350, s: 0.9, v: 0.3 }, // Hue, saturation, value
};

gui.addColor(palette, "color1");
gui.addColor(palette, "color2");
gui.addColor(palette, "color3");
gui.addColor(palette, "color4");

const init = () => {
  const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    3000
  );
  const worldScene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);

  const container = document.getElementById("container");
  container && container.appendChild(renderer.domElement);

  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.LinearEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
};

onMounted(() => {
  init();
});
</script>

<style lang="scss"></style>
