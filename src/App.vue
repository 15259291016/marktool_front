<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>

export default {
  name: 'App'
}
</script>

<style>
:root{
  --theme-color: #909399;
  --jjext-color-brand: #909399;
}

    html,body,#app{
      /* background-color: rgb(204, 232, 207); */
      overflow-x: hidden;
      overflow-y: auto;
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
</style>
