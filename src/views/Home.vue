<template>
  <div class="home">
    <div>
      <p><router-link to="/geojson">GeoJson</router-link></p>
      <p><router-link to="/about">Cool</router-link></p>
      <p><router-link to="/wire">Wire Frame</router-link></p>
      <p><router-link to="/threemap">Three Map</router-link></p>
      <p><router-link to="/cool">Cool</router-link></p>
      <p><router-link to="/water">Water</router-link></p>
    </div>
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
  display:flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>