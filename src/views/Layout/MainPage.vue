<template>
  <el-scrollbar style="height:100%;" class="is-horizontal">
    <div v-for="i in info" :key="i.title">
      <div
        style="min-height: 500px;width: 700px;border:1px solid rgba(255, 255, 255,.4);border-radius: 5px; margin: 20px auto;margin-bottom: 50px;box-shadow: 0px 0px 5px rgba(0,0,0,0.4)">
        <div style="height: 30px;width: auto;border-bottom: 1px solid rgba(0,0,0,.2) ;padding: 20px 0px 20px 20px;">
          {{ i.version }}<br>{{ i.datetime }}

        </div>
        <div style="height: 50%;width: auto;margin: 50px">
          <h3>新增：</h3>
          <ul v-for="j in i.feat" :key="j">
            <li>{{ j }}</li>
          </ul>
        </div>
        <div style="height: 50%;width: auto;margin: 50px">
          <h3>修复：</h3>
          <ul v-for="k in i.fix" :key="k">
            <li>{{ k }}</li>
          </ul>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script>
export default {
  name: 'MainPage',
  data () {
    return {
      info: []
    }
  },
  created () {
    this.get_update_info()
    this.notice()
  },
  methods: {
    notice () {
      this.$notify({
        title: '提示',
        message: '这里是主页面',
        duration: 3000
      })
    },
    get_update_info () {
      this.$axios({
        method: 'GET',
        url: this.$getUrl() + 'updateInfo/'
      }).then(res => {
        // debugger
        this.info = res.data.data
        console.log(res)
      })
    }
  }
}
</script>

<style>

::-webkit-scrollbar {
  width: 8px;

}

::-webkit-scrollbar-thumb {
  background-color: #eaecf1;
  border-radius: 3px;
}
</style>
