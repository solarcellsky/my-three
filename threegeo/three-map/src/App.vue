<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>


export default {
  name: 'app',
  components: {
  }
}
</script>

<style>
  html, body{
    width: 100%;
    height:100%;
    margin: 0;
  }
  #app {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
</style>
