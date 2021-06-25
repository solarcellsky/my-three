<template>
  <ThreeDraw />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ThreeDraw from '@/components/ThreeDraw.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'Home',
  components: {
    ThreeDraw,
  },
});
</script>

<style lang="scss">
.home {
  height: 100%;
}
</style>