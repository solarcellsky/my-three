<template>
  <div id="baby">
    <Baby />
  </div>
</template>

<script>
import Baby from '../components/Baby.vue'

export default {
  name: 'App',
  components: {
    Baby
  }
};
</script>
<style lang="scss">
#baby {
  width: 100%;
  height: 100%;
}
</style>