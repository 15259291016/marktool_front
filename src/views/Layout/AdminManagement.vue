<template>
  <div class="main">
    <div class="annotator">
        标注区域
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line
/* eslint-disable */
export default {
  name: "layout",
  data() {
    return {
      drawer: false
    };
  },
  methods: {},
  mounted() {},
  async created() {}
};
</script>
<style scoped>
.main {
  width: 100%;
  height: 100%;
}
.hid {
  float: left;
  width: 1px;
  height: 100%;
}
.annotator{
    width: 100%;
    height: 100%;
}
</style>