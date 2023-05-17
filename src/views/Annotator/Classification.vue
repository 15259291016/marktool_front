<template>
  <div class="main">
    <div class="left">
      <!-- top -->
      <div style="width:98%;">
        <!-----------------------          搜索框          ----------------------->
        <div style="width:100%; display:flex; padding-left:10px;">
          <el-input
            type="text"
            v-model="question"
            style="width:calc(100% - 100px); margin-right:5px;"
            placeholder
            v-on:keyup.enter.native="questionSearch()"
          ></el-input>
          <el-button style="min-width:100px;" type="primary" @click="questionSearch()">搜索</el-button>
          <el-button type="primary" @click="dialogFormVisible=true">设置标注</el-button>
          <el-dialog title="配置算法接口" :visible.sync="dialogFormVisible">
            <el-form :model="config">
              <el-form-item label="接口地址" :label-width="formLabelWidth">
                <el-input v-model="config.url" autocomplete="off"></el-input>
              </el-form-item>

              <el-form-item label="请求方式" :label-width="formLabelWidth">
                <el-select v-model="config.method" placeholder="请选择">
                  <el-option
                    v-for="item in config.methods"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-button type="primary" @click="demo">测试</el-button>
              <!--              <el-form-item label="活动区域" :label-width="formLabelWidth">-->
<!--                <el-select v-model="form.region" placeholder="请选择活动区域">-->
<!--                  <el-option label="区域一" value="shanghai"></el-option>-->
<!--                  <el-option label="区域二" value="beijing"></el-option>-->
<!--                </el-select>-->
<!--              </el-form-item>-->
            </el-form>
            <div slot="footer" class="dialog-footer">
              <el-button @click="dialogFormVisible = false">取 消</el-button>
              <el-button type="primary" @click="dialogFormVisible = false">确 定</el-button>
            </div>
          </el-dialog>
          <!--          <el-button style="min-width:100px;" type="primary" @click="autoMarking()">标注</el-button>-->
        </div>
      </div>

      <!-----------------------          文本显示区          ----------------------->
      <div class="textarea" @mousewheel="selectNextPage">
        <div class="text" v-html="allIntentions[$store.state.dataInfo.currentLocation].sentence"></div>
        <div class="labeled" :v-model="allIntentions[$store.state.dataInfo.currentLocation].label">
          <span
            @contextmenu.prevent="deleteLabel(l)"
            style="padding-left:5px; padding-right:5px;"
            v-for="l in allIntentions[$store.state.dataInfo.currentLocation].label"
            :key="l.id"
          >{{ l }}</span>
          <span
            style="position: absolute; right: 30px;"
          >{{ $store.state.dataInfo.currentLocation + 1 }}</span>
        </div>
      </div>

      <!-----------------------          标注按钮区          ----------------------->
      <div style="width: 100%;overflow-y: scroll;margin-left: 10px;height: 650px;">
        <div
          v-for="(each, index) in classifications"
          :key="each.id"
          style="display:flex; flex-wrap: wrap;">
          <el-button
            v-for="text in each['children']"
            :key="text.id"
            slot="reference"
            :class="'color-' + String.fromCharCode(index + 65)"
            style="margin-right: 10px; margin-top: 10px; width: 140px;font-size: 16px;"
            @click="uploadLabel(text.value)"
          >{{ text.value }}
          </el-button>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="search-result">
        <ul
          class="qagroup"
          v-for="result in searchResult"
          :key="result.id"
          @click="clickResult(result)"
        >
          <li style="width: 100%">
            <span
              style="width: 220px; color: #4799FC; display: inline-block;"
            >标签：{{ result.label.join(' ') }}</span>
            <span
              style="min-width: 120px; color: red; display: inline-block;"
            >index：{{ result.index + 1 }}</span>
          </li>
          <li style="color: rgb(44, 46, 46);">文本：{{ result.sentence }}</li>
        </ul>
      </div>
    </div>
  </div>
  <!--  <classification-dialog :dialog-form-visible =  "dialogVisible" />-->
</template>

<script>
// import ClassificationDialog from 'src/views/dialog/ClassificationDialog.vue'
/* eslint-disable */
import axios from 'axios'

export default {
  name: 'classification',
  data () {
    return {
      formLabelWidth:'100px',
      config:{
        url:'',
        method:'',
        methods:[{value:'get',label:'get'},{value:'post',label:'post'}],
        data:'',
      },
      dialogFormVisible : false,
      originUrl: '',
      // 全部数据
      allIntentions: [
        {
          sentence: '',
          label: '',
          marked: ''
        }
      ],
      url: '',
      // 分类标签
      classifications: '',
      // 文件搜索
      searchResult: [],
      question: ''
    }
  },

  components: {
    // ClassificationDialog,
  },
  created: function () {
    this.url = this.$getUrl()

    this.readConfig()
    this.$axios({
      method: 'GET',
      url: this.url + 'reqFromFileName/',
      params: {
        filename: this.$store.state.dataInfo.filename
      }
    }).then(res => {
      if (res['data']['code'] === 200) {
        this.uploadSuccess(res['data'])
      } else {
        this.$message({
          message: '数据已经被别人领了',
          type: 'error',
          duration: 2000
        })
      }
    })
  },

  computed: {},

  methods: {
    demo(){
      let config = this.config
      axios(config).then(res => {
        console.log(res)
      }).catch(error => {

      })
    },

    readConfig () {
      var department = this.$store.state.dataInfo.filename.split('_')[0]
      this.$axios({
        method: 'GET',
        url: this.url + 'ReadConfig/',
        params: {
          department: department
        }
      }).then(res => {
        if (res['data']['code'] === 200) {
          this.classifications = res['data']['data']['config']['classification']
        }
      }).catch(error =>
        this.$alert('' + error, '接口异常', {
          confirmButtonText: '确定',
          type: 'error'
        })
      )
    },

    selectNextPage (e) {
      if (e['deltaY'] > 0) {
        if (
          this.$store.state.dataInfo.currentLocation === (this.allIntentions.length - 1)
        ) {
          return
        } else {
          this.$store.state.dataInfo.currentLocation += 1
        }
      } else {
        if (this.$store.state.dataInfo.currentLocation === 0) {
          return
        }
        this.$store.state.dataInfo.currentLocation -= 1
      }
    },

    toFileDownload () {
      this.$router.push({
        name: 'FileDownload',
        params: {permission: this.permission}
      })
    },

    clickResult (item) {
      this.$store.state.dataInfo.currentLocation = item['index']
    },

    // autoMarking(){
    //   this.$axios({
    //     method:
    //   })
    //
    // },
    questionSearch () {
      // 判断数据是否存在
      if (typeof this.allIntentions == 'undefined') {
        this.$message({
          message: '没传数据',
          type: 'error',
          duration: 2000
        })
        return
      }
      this.searchResult = []
      // 首先判断是否是index搜索
      if (this.question.indexOf('index:') == 0) {
        var index = parseInt(this.question.substring(6))
        this.$store.state.dataInfo.currentLocation = index
        this.question = ''
        return
      } else {
        if (this.question.length == 0) {
          for (let i = 0; i < this.allIntentions.length; i++) {
            if (
              this.$store.state.dataInfo.dataMarkedInfo[i]['marked'] == 'sentence-no-mark'
            ) {
              let tmp = this.allIntentions[i]
              tmp['index'] = i
              this.searchResult.push(tmp)
            } else {
              continue
            }
          }
          return
        }
        // 判断上传的所有数据里面是否有符合搜索条件的句子
        for (let i = 0; i < this.allIntentions.length; i++) {
          if (
            this.allIntentions[i]['sentence'].match(this.question) ||
            this.allIntentions[i]['label'].join('').indexOf(this.question) > -1
          ) {
            let tmp = this.allIntentions[i]
            tmp['index'] = i
            this.searchResult.push(tmp)
          } else {
            continue
          }
        }
        this.searchResult.reverse()
        this.question = ''
        if (this.searchResult.length > 0) {
          return
        }
        this.$message({
          message: '未能找搜索到任何结果',
          type: 'error',
          duration: 2000
        })
        return
      }
    },

    uploadSuccess (response) {
      if (response['code'] === 200) {
        this.$store.state.dataInfo.filename = response['filename']
        // 获取所有cqa
        this.allIntentions = response['data']
        var markedCount = 0
        for (let i = 0; i < this.allIntentions.length; i++) {
          this.allIntentions[i]['id'] = i
          if (this.allIntentions[i]['label'] === '') {
            this.allIntentions[i]['marked'] = 'sentence-no-mark'
            this.allIntentions[i]['label'] = []
          } else {
            markedCount += 1
            this.allIntentions[i]['marked'] = 'sentence-mark'
            let tmp = this.allIntentions[i]['label']
            this.allIntentions[i]['label'] = tmp.split('#')
          }
        }
        // 数据/当前文件 基础信息
        this.$store.state.dataInfo.currentLocation = 0
        this.$store.state.dataInfo.dataNum = this.allIntentions.length
        this.$store.state.dataInfo.marked = markedCount
        this.$store.state.dataInfo.unmark =
          this.allIntentions.length - markedCount
        // 标注信息统计
        this.$store.state.dataInfo.dataMarkedInfo = this.allIntentions
      } else {
        // 文件上传错误的情况
        this.$message({
          message: response['message'],
          type: 'error',
          duration: 2000
        })
      }
    },

    // 删除Label
    deleteLabel (val) {
      this.allIntentions[
        this.$store.state.dataInfo.currentLocation
        ].label.splice(
        this.allIntentions[
          this.$store.state.dataInfo.currentLocation
          ].label.indexOf(val),
        1
      )
      if (
        this.allIntentions[this.$store.state.dataInfo.currentLocation].label.length === 0
      ) {
        this.allIntentions[this.$store.state.dataInfo.currentLocation][
          'marked'
          ] = 'sentence-no-mark'
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
          ].marked = 'sentence-no-mark'
        this.$store.state.dataInfo.marked -= 1
        this.$store.state.dataInfo.unmark += 1
      }

      let uuid = this.allIntentions[this.$store.state.dataInfo.currentLocation]
        .uuid
      let filename = this.allIntentions[
        this.$store.state.dataInfo.currentLocation
        ].file
      let label = this.allIntentions[
        this.$store.state.dataInfo.currentLocation
        ].label.join('#')
      let ner = ''
      let tuple = ''
      this.upload(uuid, filename, label, ner, tuple)
    },

    // 数组去重
    UniqueArray (array) {
      return Array.from(new Set(array))
    },

    earlyUpload (category) {
      if (
        this.allIntentions[this.$store.state.dataInfo.currentLocation].label !== '') {
        this.allIntentions[this.$store.state.dataInfo.currentLocation].label = [category]
      } else {
        this.allIntentions[this.$store.state.dataInfo.currentLocation].label = [category]
        this.allIntentions[this.$store.state.dataInfo.currentLocation]['marked'] = 'sentence-mark'
        return [category]
      }
      return category
    },

    uploadLabel (category) {
      // 标注标签
      // var intent = category[category.length - 1];
      var intent = category
      let label = this.earlyUpload(intent)

      let uuid = this.allIntentions[this.$store.state.dataInfo.currentLocation].uuid
      let filename = this.allIntentions[
        this.$store.state.dataInfo.currentLocation
        ].file
      let label_ = this.allIntentions[
        this.$store.state.dataInfo.currentLocation
        ].label.join('#')
      let ner = ''
      let tuple = ''

      this.upload(uuid, filename, label_, ner, tuple)
      // 统计标注信息
      if (
        this.allIntentions[this.$store.state.dataInfo.currentLocation].label
          .length > 0 &&
        category === label_
      ) {
        this.$store.state.dataInfo.marked += 1
        this.$store.state.dataInfo.unmark -= 1
        // 自动翻页
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
          ].marked = 'sentence-mark'
        this.$store.state.dataInfo.currentLocation += 1
      }
    },

    // classification按钮函数
    upload (uuid, filename, label, ner, tuple) {
      if (
        this.allIntentions[this.$store.state.dataInfo.currentLocation]
          .sentence == ''
      ) {
        this.$message({
          message: 'data error',
          type: 'error',
          duration: 1500
        })
        return
      }
      const url = this.url + 'mark/'
      var params = new URLSearchParams()
      params.append('uuid', uuid)
      params.append('filename', filename)
      params.append('label', label)
      params.append('ner', ner)
      params.append('tuple', tuple)

      this.$axios({
        method: 'POST',
        url: url,
        data: params
      })
        .then(response => {
          if (response['data']['code'] == 200) {
            this.$message({
              message: response['data']['message'],
              type: 'success',
              duration: 1000
            })
          } else if (response['data']['code'] == 201) {
            this.$message({
              message: response['data']['message'],
              type: 'success',
              duration: 1000
            })
            return
          } else {
            this.$message({
              message: response['data']['data'],
              type: 'error',
              duration: 1000
            })
            return
          }
        })
        .catch(error =>
          this.$alert('' + error, '接口异常', {
            confirmButtonText: '确定',
            type: 'error'
          })
        )
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.upload {
  vertical-align: top;
  max-width: 35%;
  max-height: 100px;
  padding-left: 10px;
  padding-right: 10px;
}

.left {
  background-color: white;
  width: 1100px;
  padding-left: 40px;
  padding-right: 20px;
}

.right {
  width: 380px;
  border-left: thick solid #b5b5b5;
  border-left-width: 10px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 50px;
}

.textarea {
  position: relative;
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  border-radius: 5px;
  width: calc(98% - 20px);
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  min-height: 120px;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
  /* letter-spacing: 2px; */
}

.textarea .labeled {
  height: 30px;
  line-height: 30px;
  display: flex;
  font-size: 20px;
  left: 5px;
  bottom: 5px;
  flex-direction: row;
  position: absolute;
  color: #4799fc;
  float: right;
  right: 5px;
  bottom: 5px;
  /* flex: bottom; */
}

.qagroup {
  font-size: 18px;
  background: rgb(227, 229, 233);
  border-radius: 5px;
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #a9abaf;
}

.search-result {
  height: 850px;
  border: 1px solid rgb(218, 218, 218);
  overflow-y: scroll;
  border-radius: 5px;
}

.show-labels {
  width: 98%;
  /* height: 200px; */
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  /* justify-content: space-around; */
}

.user-prop {
  border: 1px solid white;
  border-radius: 3px;
  padding: 2px;
  font-size: 14px;
  float: right;
  width: 100px;
  height: 36px;
  background: #4799fc;
}

.sentence-mark {
  width: 20px;
  background-color: green;
}

.sentence-no-mark {
  width: 20px;
  background-color: red;
}

.sentence-block-status div {
  display: inline-block;
  width: 60px;
  height: 17px;
  margin-right: 8px;
}

.sentence-block-status .el-button {
  border: 0;
  padding: 0;

}

.sentence-block {
  height: 300px;
}

.sentence-small-block {
  width: 30px;
  height: 17px;
  margin-left: 4px;
  margin-right: 6px;
  margin-top: 10px;
  float: left;
  color: white;
  font-size: 10px;
  text-align: center;
  border-radius: 2px;
  cursor: pointer;
}

.mark-situation {
  color: rgb(44, 164, 243);
  border-radius: 3px;
  text-align: center;
  background: white;
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  border: 1px solid rgb(218, 218, 218);
}

.sentence-small-block:hover {
  box-shadow: 0px 0px 1px 1px gray;
}

.color-A {
  color: rgb(31, 119, 180);
}

.color-B {
  color: rgb(255, 127, 14);
}

.color-C {
  color: rgb(44, 160, 44);
}

.color-D {
  color: rgb(214, 39, 40);
}

.color-E {
  color: rgb(148, 103, 189);
}

.color-F {
  color: rgb(140, 86, 75);
}

.color-G {
  color: rgb(227, 119, 194);
}

.color-H {
  color: rgb(127, 127, 127);
}

.color-I {
  color: rgb(188, 189, 34);
}

.color-J {
  color: rgb(23, 190, 207);
}

.div-btn {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style>

<style>
/* .inputBackground{
    background:cyan;
  } */
.el-button + .el-button {
  margin-left: 0px;
}

.el-button--medium {
  height: 40px;
}
</style>
