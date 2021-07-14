<template>
  <div :class="expand ? 'hamburg expand' : 'hamburg'" @click="toggleInfoPanels">
    <img :src="expand ? 'assets/ui/close.svg' : 'assets/ui/hamburg.svg'" alt="">
  </div>
</template>
<script>
export default {
  name: 'Hamburg',
  data () {
    return {
      expand: true
    }
  },
  created() {},
  methods: {
    toggleInfoPanels() {
      this.expand = !this.expand;
      this.$emit('toggleInfoPanels', this.expand)
    }
  }
};
</script>
<style lang="scss" scoped>
.hamburg {
  display: flex;
  position: absolute;
  top: 10px;
  left: 10px;
  overflow: hidden;
  z-index: 10000;
  background-color: rgba(255, 255, 255, .618);
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, .5);
  padding: 0 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: left .2s ease-out;

  &.expand {
    left: 380px;
  }

  &:hover {
    img {
      opacity: 1;
    }
  }

  img {
    display: block;
    width: 100%;
    height: auto;
    vertical-align: middle;
    opacity: .5;
    transition: opacity .3s ease-out;
  }
} 
</style>