import Vue from 'vue'
import vuex from 'vuex'
Vue.use(vuex)

export default new vuex.Store({
  state: {
    user: {
      'zh_name': '',
      'permission': -1
    },
    dataInfo: {
      // 文件名
      filename: '',
      // 文件类型
      mclass: 'classification',
      // 当前位置
      currentLocation: 0,
      // 数据量
      dataNum: 0,
      // 已标注
      marked: 0,
      // 未标注
      unmark: 0,
      // 近期标注
      recentlyBrowsing: [],
      // 进度统计
      dataMarkedInfo: []
    },
    fileManager: {
      unMarkFilesClassName: '',
      unNameFilesClassName: '',
      checkFilesClassName: '',
      activeName: '已标注'
    }
  }
})
