<template>
  <div class="control-wrap">
    <div class="control">
      <div class="slider" @mousedown="onMousedown" @mouseout="onMouseOut">
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
    return {
      $ruler: '', // 滑竿
      $bar: '', // 左侧滑块
      $endbar: '', // 右侧滑块
      startX: '', // 左侧滑块位置
      endX: '', // 右侧滑块位置
      step: '', // 滑竿在限定范围内可以分多少步
      intervalStart: 0, 
      intervalEnd: 24,
      startStep: 0,
      endStep: 24,
      amountW: '' //  滑竿多长距离
    }
  },
  created() {
    const vm = this;
    vm.$nextTick(() => {
      vm.initSlider();
    })
  },
  methods: {
    initSlider(){
      const vm = this;
      vm.$guide = vm.$refs.guide;
      vm.$bar = vm.$refs.bar;
      // 滑竿多长距离
      vm.amountW = vm.$guide.clientWidth - vm.$bar.clientWidth; 
      // 总共多少步
      vm.step = vm.amountW / (vm.intervalEnd - vm.intervalStart);
    },
    onMousedown(e) {
      const vm = this;
      window.addEventListener( 'mousemove', this.onMouseMove );
      vm.onMouseMove( e );
      event.stopPropagation();
      return false;
    },
    onMouseMove(e) {
      const vm = this;
      const sliderWidth = vm.$guide.offsetWidth;
      const mouseX = e.pageX - vm.$bar.offsetLeft;  // local mouse x
      let percent = mouseX / e.pageX;
      var eleX = box.offsetLeft;
      // percent = (percent > 1) ? 1 : (percent < 0) ? 0 : percent;
      // console.log(e.originalEvent)
      vm.$bar.style.width = percent * 100 + '%';
      console.log(e)
      this.onChangeCallback( percent );

      // // 滑动距离=当前滑块x距离-最开始滑块距离
      // let slidedis = e.touches[0].pageX - vm.$ruler.offsetLeft; 

      // // 滑动距离小于0 或者大于滑竿的宽度，return掉
      // if (slidedis < 0 || slidedis > vm.amountW) {
      //   return;
      // }
      // let ste = Math.round(slidedis / vm.step);
      // if ((ste + vm.intervalStart) >= vm.endStep) {
      //   return;
      // }
      // vm.startStep = ste + vm.intervalStart;
      // vm.$bar.style.left = (ste * vm.step) + 'px'
    },
    onChangeCallback(val) {
      // console.log(val)
    },
    onMouseOut() {
      window.removeEventListener( 'mousemove', this.onMouseMove )
    }
  }
};
</script>
<style lang="scss" scoped>
.control-wrap {
  position: absolute;
  top: 87px;
  right: 30px;
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