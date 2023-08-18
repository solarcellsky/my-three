<template>
  <div style="width: 100%;height: 100%;">
    <three ref="three"/>
  </div>
</template>

<script>

  import Three from './Three'
  export default {
    name: "Index.vue",
    components:{
      Three,
    },
    data(){
      return{
      }
    },
    mounted() {
      this.addThree()
    },
    methods:{
      addThree(){
        const that=this
        this.$refs.three.adds(this.fileUrl)
      },
    }

  }
</script>

<style scoped>

</style>
