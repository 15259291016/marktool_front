<template>
  <div class="top">
    <!-- 标注类型 -->
    <div class="top-button">
      <el-dropdown @click="getCurrentMClass" :show-timeout="0">
        <span>{{ currentMClass }}</span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="(eng_mclass, zh_mclass) in markClass"
            :key="eng_mclass.id"
            :command="zh_mclass"
            @click.native="slideMClass(zh_mclass)"
          >{{zh_mclass}}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- <div class="top-button" @click="toFileManagement">文件管理</div> -->

    <!-- <div class="top-button" v-if="$store.state.user.permission > 3">标签管理</div> -->

    <div class="top-button" @click="download">下载中心</div>

    <!-- <div class="top-button">
      <a
        style="text-decoration:none; color:white"
        href="www.baidu.com"
        target="_blank"
      >常见问题</a>
    </div> -->
    <div
      class="top-button username"
      @click="showUserInfo(), userInfoVisible=true"
    >{{ user.zh_name }}</div>
    <el-dialog title="用户资料" :visible.sync="userInfoVisible" class="spec-dialog">
      <el-button
        @click="regVisible=true"
        type="warning"
        v-if="$store.state.user.permission === 5 "
      >账号注册</el-button>
      <!-- 新增账号 -->
      <el-dialog width="384px" title="账号注册" :visible.sync="regVisible" append-to-body>
        <div>
          <el-input placeholder="账号" v-model="username">
            <template slot="prepend">账号：</template>
          </el-input>
        </div>
        <div>
          <el-input placeholder="密码" v-model="password" show-password type="password">
            <template slot="prepend">密码：</template>
          </el-input>
        </div>
        <div>
          <el-input placeholder="中文姓名" v-model="zh_name">
            <template slot="prepend">姓名：</template>
          </el-input>
        </div>
        <div>
          <span class="permission-span">权限：</span>
          <el-select
            v-model="permission"
            style="width: 260px; position: relative; bottom: 40px; left: 83px;"
          >
            <el-option v-for="item in [1, 2, 3, 4]" :key="item.id" :label="item" :value="item"></el-option>
          </el-select>
        </div>
        <el-button type="primary" @click="createUser">创 建</el-button>
      </el-dialog>
      <!-- 标注数量查询 -->
      <el-dialog
        width="700px"
        title="标注数量查询"
        :visible.sync="dateVisible"
        @closed="selectDatetime='', split_date=[], split_server=[]"
        append-to-body
      >
        <div class="user-mark-date">
          <el-date-picker
            v-model="selectDatetime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            @change="selectEveryoneMarkedCount(selectUser)"
          ></el-date-picker>
          <!-- 默认个人 -->
          <el-button
            type="primary"
            style="margin-left: 10px;"
            @click="selectEveryoneMarkedCount(selectUser)"
          >个人</el-button>
          <el-button
            type="danger"
            v-if="$store.state.user.permission > 3"
            @click="selectEveryoneMarkedCount('')"
          >全员</el-button>
        </div>
        <div style="height: 500px; overflow-y: scroll; margin-top: 10px;">
          <div>
            <span style="font-size: 18px;">
              <b>个人数量统计情况：</b>
            </span>
            <ul v-for="(value, sdate) in split_date" :key="value.id">
              <span style="font-size: 16px;">
                <b>{{ sdate }}</b>
              </span>
              <li v-for="(v, k) in value" :key="k.id">{{ k }} ： {{ v }}</li>
            </ul>
          </div>
          <el-divider></el-divider>
          <div>
            <span style="font-size: 18px;">
              <b>标注类型数量统计情况：</b>
            </span>
            <ul v-for="value in split_server" :key="value.id">{{value.server}} ：{{value.count}}</ul>
          </div>
        </div>
      </el-dialog>
      <!-- 账号信息展示 -->
      <el-table :data="usersInfo" :default-sort="{prop: 'last_change_date', order: 'ascending'}">
        <el-table-column property="username" label="账号" width="150">
          <template slot-scope="scope">
            <span @click="dateVisible=true, selectUser=scope.row.username">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column property="permission" label="权限级别" width="100" sortable>
          <template slot-scope="scope">
            <span v-if="!changeStatus" @click="changeStatus=true">{{ scope.row.permission }}</span>
            <el-select
              :disabled="$store.state.user.permission !== 5"
              v-if="changeStatus"
              v-model="scope.row.permission"
              placeholder="请选择"
            >
              <el-option v-for="item in [1, 2, 3, 4]" :key="item.id" :label="item" :value="item"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column property="zh_name" label="中文名" width="150">
          <template slot-scope="scope">
            <span v-if="!changeStatus" @click="changeStatus=true">{{ scope.row.zh_name }}</span>
            <el-input
              v-if="changeStatus"
              :disabled="$store.state.user.permission !== 5"
              placeholder="中文姓名"
              v-model="scope.row.zh_name"
              v-on:keyup.enter.native="changeStatus=!changeStatus, updateUser(scope.row.username, scope.row.password, scope.row.permission, scope.row.zh_name)"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column property="password" label="密码" width="180">
          <template slot-scope="scope">
            <span v-if="!changeStatus" @click="changeStatus=true">********</span>
            <el-input
              v-if="changeStatus"
              placeholder="中文姓名"
              show-password
              type="password"
              v-model="scope.row.password"
              v-on:keyup.enter.native="changeStatus=!changeStatus, updateUser(scope.row.username, scope.row.password, scope.row.permission, scope.row.zh_name)"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column property="last_change_date" label="最后登录时间" width="180" sortable></el-table-column>
      </el-table>
    </el-dialog>
    <div class="top-button exit" @click="exit">退出</div>
  </div>
</template>

<script>
/* eslint-disable */

import {removeToken} from '../../utils/auth'

export default {
  name: "Login",
  data() {
    return {
      currentMClass: "首页",
      markClass: {
        '首页': "mainpage",
        '分类任务': "classification",
        'cqa': "cqa",
        '知识图谱': "graph",
        '二元组': "twotuples",
        '多分类任务': "multiclassification"
      },
      markClassE2Z: {
        mainpage: '首页',
        classification: "分类任务",
        cqa: "cqa",
        graph: "知识图谱",
        twotuples: "二元组",
        multiclassification: "多分类任务"
      },
      user: {},
      selectDatetime: "",
      dateVisible: false,
      changeStatus: false,
      regVisible: false,
      userInfoVisible: false,
      selectUser: "",
      username: "",
      password: "",
      zh_name: "",
      permission: 0,
      usersInfo: [],
      split_date: [],
      split_server: []
    };
  },

  async created() {
    this.url = this.$getUrl();
    this.user = this.$store.state.user;
    this.currentMClass = this.markClassE2Z[
      sessionStorage.getItem("mclass") || "classification"
    ]
    if (this.currentMClass==='首页'){
      this.$router.replace('/Layout/MainPage')
    }
    this.$store.state.dataInfo.mclass = this.markClass[this.currentMClass];
    this.$store.state.user.zh_name = sessionStorage.getItem("zh_name");
    this.$store.state.user.permission = sessionStorage.getItem("permission")
  },

  methods: {
    getCurrentMClass(currentMClass) {
      this.$store.state.dataInfo.mclass = this.markClass[currentMClass];
      sessionStorage.setItem("mclass", this.markClass[currentMClass]);
      this.toFileManagement();
    },

    slideMClass(zh_mcalss) {
      this.currentMClass = zh_mcalss;
      this.$store.state.dataInfo.mclass = this.markClass[zh_mcalss];
      sessionStorage.setItem("mclass", this.markClass[this.currentMClass]);
      this.toFileManagement();
    },

    toFileManagement() {
      // debugger
      if(this.currentMClass==='首页'){
        this.$router.go(0)
        this.$router.replace("/Layout/MainPage");
      }
      if(this.currentMClass===undefined){
        this.$router.go(0)
        this.$router.replace("/Layout/MainPage");
      }

      this.$router.push("/Layout/FileManagement");
    },

    exit() {
      removeToken();
      this.$router.push("/Login");
    },

    download() {
      this.$router.push("/Layout/FileDownload");
    },

    selectEveryoneMarkedCount(zh_name) {
      if (zh_name !== "") {
        for (let i = 0; i < this.usersInfo.length; i++) {
          if (this.usersInfo[i]["username"] === zh_name) {
            zh_name = this.usersInfo[i]["zh_name"];
            break;
          }
        }
      }

      if (
        (new Date(this.selectDatetime[1]).getTime() -
          new Date(this.selectDatetime[0]).getTime()) /
          (1000 * 86400) >
        14
      ) {
        this.$message({
          message: "查询时间别超过14天",
          type: "error",
          duration: 2000
        });
        return;
      }

      this.$axios({
        method: "GET",
        url: this.url + "selectEveryoneMarkedCount",
        params: {
          zh_name: zh_name,
          start_date: this.selectDatetime[0] + " 00:00",
          end_date: this.selectDatetime[1] + " 23:59"
        }
      }).then(res => {
        if (res["data"]["code"] === 201) {
          this.$message({
            message: res["data"]["message"],
            type: "error",
            duration: 2000
          });
        } else {
          this.split_date = res["data"]["data"][0];
          this.split_server = res["data"]["data"][1];
          this.$message({
            message: res["data"]["message"],
            type: "success",
            duration: 2000
          });
        }
        // this.$forceUpdate();
      });
    },

    createUser() {
      this.$axios({
        method: "GET",
        url: this.url + "createUser",
        params: {
          username: this.username,
          password: this.password,
          permission: this.permission,
          zh_name: this.zh_name
        }
      }).then(res => {
        this.$message({
          message: res["data"]["message"],
          type: "success",
          duration: 2000
        });
      });
    },

    updateUser(username, password, permission, zh_name) {
      this.$axios({
        method: "GET",
        url: this.url + "updateUser",
        params: {
          username: username,
          password: password,
          permission: permission,
          zh_name: zh_name
        }
      }).then(res => {
        this.$message({
          message: res["data"]["message"],
          type: "success",
          duration: 2000
        });
      });
    },

    showUserInfo() {
      this.$axios({
        method: "GET",
        url: this.url + "getUsersInfo/",
        params: {
          zh_name: this.user["zh_name"]
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.usersInfo = res["data"]["data"];
        }
      });
    }
  }
};
</script>

<style scoped>
.top {
  height: 50px;
  background-color: rgb(28, 169, 224);
}

.top-button {
  font-size: 16px;
  height: 50px;
  width: 100px;
  line-height: 50px;
  text-align: center;
  display: inline-block;
  vertical-align: middle;
  color: white;
}

.top-button:hover {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.2);
}

.top-button:active {
  background-color: rgba(157, 222, 28, 0.2);
}

.top-button:is-active {
  background-color: rgba(33, 245, 65, 0.2);
}

.top .exit {
  position: absolute;
  right: 0px;
}
.top .username {
  position: absolute;
  right: 120px;
}

.permission-span {
  background-color: #f5f7fa;
  color: #909399;
  vertical-align: middle;
  display: table-cell;
  position: relative;
  border: 1px solid #dcdfe6;
  padding: 0 20px;
  width: 1px;
  height: 38px;
  white-space: nowrap;
}
</style>

<style>
.el-dropdown {
  color: white;
  font-size: 16px;
}

.spec-dialog .el-dialog__body {
  padding: 3px 30px;
  overflow-y: scroll;
  height: 600px;
}

.el-dialog {
  width: 820px;
}
</style>
