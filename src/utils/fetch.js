import axios from 'axios'
import { getToken } from './auth.js'
import getApiUrl from './index.js'
import ElementUI from 'element-ui'
// import store from '../store'

let token = getToken()
const baseURL = getApiUrl()
// 创建axios实例
const fetch = axios.create({
  baseURL: baseURL, // api的base_url
  // timeout: 5000     // 请求超时时间s
  validateStatus: function (status) {
    return status < 500 // 状态码在大于或等于500时才会 reject
  }
})

// 这段必须有，否则一刷新，token 就没了
// 如果token里面有写中文，则会报错，并导致ajax无法发送
if (token) {
  fetch.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
fetch.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      // 401状态码为过期
      // eslint-disable-next-line no-undef
      ElementUI.Message({
        message: 'token过期, 请重新登陆',
        type: 'error',
        duration: 5 * 1000
      })
    //   store.dispatch('LogOut')
      // removeToken()
      // router.push('/login')
    } else if (res.status === -1 || res.status === -2) {
      // -1/-2状态码， token验证错误
      // eslint-disable-next-line no-undef
      ElementUI.Message({
        message: 'token过期, 请重新登陆',
        type: 'error',
        duration: 4 * 1000,
        onClose () {
          // window.location.href=process.env.VUE_APP_TEST_URL+"/"
          window.location.href = '/'
          localStorage.removeItem('token')
        }
      })
    } else {
      return response
    }
  },
  error => {
    console.error('拦截器err' + error)
  }
)
export default fetch
