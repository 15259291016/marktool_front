// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import ElementUi from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'
import store from './store'

axios.defaults.timeout = 20000
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
Vue.prototype.$axios = axios
Vue.prototype.$getUrl = () => {
  if (process.env.NODE_ENV !== 'development') {
    return 'http://0.0.0.0:8005/'
  } else {
    return 'http://127.0.0.1:8000/'
  }
}

Vue.config.productionTip = false
Vue.use(ElementUi)
/* eslint-disable no-new */
new Vue({
  store,
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
