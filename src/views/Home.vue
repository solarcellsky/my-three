<template>
  <div class="home">
    <ul>
      <li><a href="/geojson">GeoJson</a></li>
      <li><a href="/about">Cool</a></li>
      <li><a href="/wire">Wire Frame</a></li>
      <li><a href="/threemap">Three Map</a></li>
      <li><a href="/cool">Cool</a></li>
      <li><a href="/water">Water</a></li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
});
</script>

<style lang="scss">
.home {
  height: 100%;
  ul {
    padding: 50px;
    list-style: none;
    line-height: 1.4;
  }
}
</style>