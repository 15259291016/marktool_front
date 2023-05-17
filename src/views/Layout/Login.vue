<template>
  <div id="login" class="container">
    <div class="login-form">
      <div class="login-header">
        文本标注工具
      </div>
      <form class="form">
        <div class="login-user">

          <el-input type="text" v-model="username" clearable>
            <template slot="prepend">用户名：</template>
          </el-input>
            <el-input style="padding-top: 15px"
              type="password"
              v-model="password"
              @keyup.enter.native="readytologinOrRegister()"
              clearable
            >
              <template slot="prepend">密 &nbsp;&nbsp;码：</template>
            </el-input>

        </div>
        <div class="login-submit" unselectable="on" onselectstart="return false;">
          <div class="login-botton" @click="readytologinOrRegister()">登入</div>
          <div class="login-submit-hint account-hint">
            未有帐号
            <span @click="$message.warning('联系管理员添加账户')">注册</span>
          </div>
          <div
            class="login-submit-hint user-forget-hint"
            @click="userForget()"
            unselectable="on"
            onselectstart="return false;"
          >忘记密码或用户名？
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
import fetch from '@/utils/fetch'
import auth from '@/utils/auth'
import {setToken} from '../../utils/auth'
// import md5 from 'js-md5';

export default {
  name: 'Login',
  data () {
    return {
      loginBottonWord: '',
      loginStatus: true,
      userTypeWrong: false,
      username: '',
      password: '',
      token: '',
      count: 0,
      forgetMessage: '找管理员重置密码'
    }
  },

  created () {
    this.url = this.$getUrl()
    this.token = localStorage.getItem('token') || ''
    // this.username = localStorage.getItem("username") || "";

    // this.readytologinOrRegister()
  },

  methods: {
    /*
     * 忘记密码或用户名提示语
     */
    userForget () {
      switch (this.count / 3) {
        case 1: {
          this.forgetMessage = '找管理员重置密码'
          break
        }
        case 2: {
          this.forgetMessage = '找管理员重置密码'
          break
        }
        case 3: {
          this.forgetMessage = '找管理员重置密码'
          break
        }
      }

      console.log(this.count)
      this.count++
      this.$message.warning(this.forgetMessage)
    },
    /*
     * 登入页切换状态，登入或注册
     */
    loginChange () {
      if (this.loginStatus) {
        // this.loginStatus = !this.loginStatus;
        this.loginHint = '未有帐号'
        this.loginHintAction = '注册'
        this.loginBottonWord = '登入'
      } else {
        this.$message.warning('明明都分配给你帐号了。。。')
        // this.loginHint = '已有帐号'
        // this.loginHintAction = '登入'
        // this.loginBottonWord = '注册'
      }
    },
    /*
     * 点击登入或注册按钮
     */
    async readytologinOrRegister () {
      // await this.userMessageChecking();
      var params = new URLSearchParams()
      params.append('username', this.username)
      params.append('password', this.password)

      this.$axios({
        method: 'POST',
        url: this.url + 'Login/',
        data: params
      }).then(response => {
        if (response['data']['code'] == 200) {
          let permission = response['data'].content.permission
          this.$store.state.user.permission = permission
          this.$store.state.user = response['data'].content
          setToken(response['data'].content.token)
          sessionStorage.setItem('permission', response['data'].content.permission)
          sessionStorage.setItem('zh_name', response['data'].content.zh_name)
          fetch.defaults.headers.common['Authorization'] = `Bearer ${response['data'].content.token}`
          this.$router.push('/Layout/MainPage')
        } else {
          this.$message.error(response.data.content)
        }
      })
    },
    /*
     * 检查使用者输入的内容是否符合5-15位英文+数字的组合
     */
    async userMessageChecking () {

      let regex = /^[a-zA-Z0-9]{1,15}$/

      let isAccountPass = this.username.match(regex)
      let isPassworkPass = this.password.match(regex)

      if (isAccountPass == null || isPassworkPass == null) {
        this.userTypeWrong = true
        this.$message.error('帐号密码格式错误，5-15位英文+数字')
      }
    }
  }
}
</script>

<style scoped>
#login .login-user .el-input__icon {
  height: 70%;
}

#login {
  height: 100vh;
  background-size: cover;
  /* background-image: url(../../assets/bg.jpeg); */
}

#login::after {
  content: "";
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  background: inherit;
  filter: blur(2px);
  z-index: 2;
}

.login-form {
  width: 550px;
  height: 450px;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgb(133 115 115 / 50%);
  background-color: rgb(255, 255, 255);
  position: absolute;
  top: 140px;
  left: 600px;
  z-index: 100;
}

.login-header {
  height: 70px;
  margin: 30px 64px;
  font-size: 70px;
  color: rgb(26, 26, 26);
  font-weight: bold;
  /* background-size: cover;
  background-repeat: no-repeat;
  background-image: url(../../assets/logo2.png) */
  text-shadow: 0.1em 0.1em 0.3em rgba(26, 26, 26, 0.5);
}

.login-header img {
  margin: 0 auto;
  width: 300px;
  height: 140px;
}

.login-user {
  margin-top: 10px;
  width: 80%;
  margin: 0 auto;
}

#login .login-user input {
  margin-bottom: 20px;
  line-height: 24px;
  height: 48px;
  font-size: 16px;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #f3f3f3;
  border-radius: 0;
  color: #1a1a1a;
}

.login-submit {
  margin-top: 30px;
  font-size: 20px;
  text-align: center;
}

.login-botton {
  margin: 0 auto;
  /* background-color: #00BFFF; */
  background-color: #2c3e50;
  color: white;
  width: 75%;
  padding: 10px;
  border-radius: 1px;
}

.login-botton:hover {
  cursor: pointer;
}

.login-submit-hint {
  margin-top: 25px;
}

.account-hint span:hover {
  cursor: pointer;
  text-decoration: underline;
}

.user-forget-hint:hover {
  cursor: pointer;
  text-decoration: underline;
}

</style>
