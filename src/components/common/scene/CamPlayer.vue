<template>
  <div class="cam-stream">
    <iframe scrolling="no" :src="`/webrtcstreamer/index.html?video=${stream}&name=${name}`"></iframe>
  </div>
</template>
<script>
export default {
  name: 'CamPlayer',
  props: {
    stream: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    },
  },
  mounted() {},
  methods: {}
}
</script>

<style lang="scss">
.cam-stream {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($color: #000000, $alpha: .68);
  border-right: 1px solid #ffffff;

  & iframe {
    border: 0;
  }
}
</style>