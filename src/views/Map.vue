<template>
  <ThreeMap />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ThreeMap from '@/components/ThreeMap.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'Map',
  components: {
    ThreeMap,
  },
});
</script>
