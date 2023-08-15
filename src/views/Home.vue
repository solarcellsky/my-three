<template>
  <div class="home">
    <div>
      <template v-for="link in links" :key="link.name">
        <p>
          <router-link :to="link.path">{{ link.name }}</router-link>
        </p>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  setup(props, context) {
    const links = [
      { name: "GeoJson", path: "/geojson" },
      { name: "Cool", path: "/about" },
      { name: "Wire Frame", path: "/wire" },
      { name: "Three Map", path: "/threemap" },
      { name: "Three MapBox", path: "/threemapbox" },
      { name: "Three MapBox Old", path: "/threemapboxold" },
      { name: "Water", path: "/water" },
      { name: "Shield", path: "/shield" },
      { name: "Baby", path: "/baby" },
    ];

    return {
      links,
    };
  },
});
</script>

<style lang="scss">
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
