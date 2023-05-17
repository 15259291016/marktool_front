<template id="home">
  <div class="appmain" id="AppMain">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'AppMain',
  props: {
    msg: String
  }
}

</script>

<style scoped>
.appmain{
  width: 100%;
  height: 100%;
  max-height: 900px;
  padding-top: 10px;
}
</style>
