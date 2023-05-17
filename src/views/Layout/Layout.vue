<template>
  <div class="app-wrapper">
    <top-menu></top-menu>
    <div class="mainbody">
      <left-drawer></left-drawer>
      <app-main></app-main>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import TopMenu from './TopMenu.vue'
import AppMain from './AppMain.vue'
import LeftDrawer from './LeftDrawer.vue'

// eslint-disable-next-line
/* eslint-disable */
export default {
  name: "layout",
  components: {
    TopMenu,
    LeftDrawer,
    AppMain
  },
  data() {
    return {}
  },
  methods: {},
  mounted() {},
  async created() {}
};
</script>
<style scoped>
.app-wrapper {
  padding: 0px;
  margin: 0px;
  width: 100%;
  height: 100%;
}
.mainbody {
  position: absolute;
  top: 50px;
  width: 100%;
  height: calc(100% - 50px);
  overflow: hidden;
}
.hid-data {
  float: left;
  width: 1px;
  height: 100%;
}
.hid-search {
  background-color:blue;
  float: right;
  width: 1px;
  height: 100%;
}
.el-scrollbar__wrap {
  overflow-x: hidden;
}

.cqa .el-textarea__inner {
  border-radius: 0px;
}

.el-textarea.is-disabled .el-textarea__inner {
  color: rgb(102, 97, 97);
}

/*滚动条样式*/
::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 4px;
}
::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #e0e5eb;
}
::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  border-radius: 0;
}
</style>