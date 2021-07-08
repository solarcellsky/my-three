<template>
  <div class="control-wrap" ref="control">
    <div class="control">
      <div class="slider" @mousedown="changeSlider">
        <div class="guide" ref="guide"></div>
        <div class="bar" ref="bar"></div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Slider',
  data () {
    return {}
  },
  created() {},
  methods: {
    changeSlider(e) {
      const vm = this;
      vm.$control = vm.$refs.control;
      vm.$guide = vm.$refs.guide;
      vm.$bar = vm.$refs.bar;
      const sliderWidth = vm.$guide.offsetWidth;
      const startX = e.clientX;

      document.onmousemove = function(e) {
        e.preventDefault();
        const mouseX = e.clientX - vm.$control.offsetLeft - 30;

        let percent = mouseX / sliderWidth;
        percent = (percent > 1) ? 1 : (percent < 0) ? 0 : percent;
        vm.$bar.style.width = percent * 100 + '%';
        vm.onChangeCallback( percent );
      }
      document.onmousedown = function(e) {
        e.preventDefault();
        const mouseX = e.clientX - vm.$control.offsetLeft - 30;

        let percent = mouseX / sliderWidth;
        percent = (percent > 1) ? 1 : (percent < 0) ? 0 : percent;

        vm.$bar.style.width = percent * 100 + '%';
        vm.onChangeCallback( percent );
      }
      document.onmouseup = function() {
        document.onmousemove = null;
      }
    },
    onChangeCallback(val) {
      this.$emit('onChange', val)
    },
  }
};
</script>
<style lang="scss" scoped>
.control-wrap {
  position: absolute;
  top: 20px;
  right: 220px;
  overflow: hidden;
  z-index: 10000; 

  .control {

    .label {
      color: #ccc;
      text-transform: uppercase;
      font-size: 12px;
      float: left;
      padding: 0 12px;
      line-height: 34px;
      height: 35px;
      box-sizing: border-box;
      border: 1px solid #999;
      border-right: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      cursor: default; 
    }

    .slider {
      float: left;
      position: relative;
      width: 220px;
      height: 35px;
      padding: 10px 30px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      cursor: ew-resize;

      &:before, &:after {
        display: inline-block;
        position: absolute;
        color: #ccc;
        font-size: 14px;
        /* use !important to prevent issues with browser extensions that change fonts */
        speak: none;
        font-style: normal;
        font-weight: 700;
        font-variant: normal;
        text-transform: none;
        line-height: 1;
        /* Better Font Rendering =========== */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale; }
      &:before {
        content: '\2212';
        left: 7px;
        top: 9px; }
      &:after {
        content: '\002B';
        right: 7px;
        top: 9px; }

      .guide {
        position: absolute;
        top: 16px;
        width: 158px;
        border-top: 1px solid #ccc;
        box-sizing: border-box; }

      .bar {
        position: relative;
        top: 0px;
        left: 0px;
        width: 30%;
        height: 100%;
        background-color: #ccc;
        transition: all .3s; }

    }

    &:hover {
      .bar {
        background-color: white; }
    }

  }
} 
</style>