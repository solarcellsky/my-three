<template>
  <div class="home">
    <div class="grid">
      <template v-for="link in links" :key="link.name">
        <div class="link">
          <router-link :to="link.path">{{ link.name }}</router-link>
        </div>
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
      { name: "Three MapBox Native", path: "/threemapboxnative" },
      { name: "Three MapBox Old", path: "/threemapboxold" },
      { name: "* ShangHai City *", path: "/city" },
      { name: "Water", path: "/water" },
      { name: "Shield", path: "/shield" },
      { name: "Baby", path: "/baby" },
      { name: "Dat UI", path: "/dat_ui" },
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
  .grid {
    display: grid;
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    grid-template-columns: auto auto;
  }
  & .link {
    width: 220px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 4px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    border-radius: 4px;
    & > a {
      text-decoration: none;
      color: #696969;
      transition: all 0.3s ease-in-out;
    }
    &:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(0, 0, 0, 0.1);
      & a {
        color: #adadad;
      }
    }
  }
}
</style>
