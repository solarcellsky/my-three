<template>
  <div class="cam-stream">
    <video 
      id="cam_stream" 
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      width="800"
      height="480"
      poster="assets/texture/starry.jpg"
      data-setup="{}"
    >
      <source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
    </video>
  </div>
</template>
<script>
import videojs from 'video.js';
import 'videojs-flash';
import 'video.js/dist/video-js.min.css';

export default {
  name: 'CamPlayer',
  mounted() {
    this.playCamStream('cam_stream');
  },
  methods: {
    playCamStream(id) {
      const options = {};

      const player = videojs(id, options, function onPlayerReady() {
        videojs.log('Your player is ready!');

        // In this context, `this` is the player that was created by Video.js.
        this.play();

        // How about an event listener?
        this.on('ended', function() {
          videojs.log('Awww...over so soon?!');
        });
      });
    }
  }
}
</script>

<style lang="scss">
.cam-stream {
  display: flex;
  position: absolute;
  z-index: 10001;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  background-color: rgba($color: #000000, $alpha: .68);
}
</style>