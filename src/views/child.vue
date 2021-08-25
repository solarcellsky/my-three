<template>
  <div>
    <div>child:</div>
    <div>修改前：{{oldUser}} 修改后：{{user}}</div>
    <div>{{userInfo}}</div>
  </div>
</template>
<script>
export default {
  name: 'child',
  props: ['user'],
  data () {
    return {
      oldUser: {}
    }
  },
  // 缓存 userInfo   
  computed: {
    userInfo () {
      return { ...this.user }
    }
  },
  watch: {
    userInfo: {
      handler (val, oldVal) {
        this.oldUser = oldVal || val
      },
      deep: true,
      immediate: true
    }
  }
}
</script>