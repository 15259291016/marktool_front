<template>
  <div class="main">
    <!-- 47.100.226.195 -->
    <el-upload class="upload" ref="upload" action="http://localhost:8001/uploadfile/" :on-change="getFileName" :on-success="uploadSuccess" accept=".csv" :limit="1" :auto-upload="false">
      <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
      <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload">上传到服务器</el-button>
    </el-upload>

    <div style="width:70%;">
      <!-- C -->
      <div style="display: flex; align-items: flex-start" id="leftBox">
        <el-input id="c" v-model="CID" style="width:22%; font-size:15px;" disabled></el-input>
        <el-input style="width:80%;" v-model="cqas.context" type="textarea" autosize placeholder="多个Context用空格隔开"></el-input>
      </div>
      <!-- Q -->
      <div style="display: flex; align-items: flex-start;" id="leftBox">
        <el-input id="q" v-model="QID" style="width:22%; font-size:15px;" disabled></el-input>
        <el-input style="width:80%;" v-model="cqas.question" type="textarea" autosize disabled></el-input>
      </div>
      <!-- A -->
      <div style="display: flex; justify-content: flex-start" id="leftBox">
        <el-input id="a" v-model="AID" style="width:22%; font-size:15px;" disabled></el-input>
        <el-input style="width:80%;" v-model="cqas.answer" type="textarea" autosize></el-input>
      </div>

      <!-- 进度条 -->
      <el-button style="width:100%; height:30px; border:0px; padding:0px;" @click="back()">
        <el-progress :percentage="marked_id/cqas_length*100" status="success" style="width:101%;"></el-progress>
      </el-button>
    </div>
    <span>{{ marked_process[index] }}</span>

    <!-- 进度圈 -->
    <div class="percent">
      <el-button @click="upload('通用FAQ')">
        <el-progress type="circle" :percentage="marked.通用FAQ/cqas_length*100" status="text" color="#f0b255">通用CQA</el-progress>
      </el-button>
      <el-button @click="upload('删除FAQ')">
        <el-progress type="circle" :percentage="marked.删除FAQ/cqas_length*100" status="text" color="#ff7963">删除CQA</el-progress>
      </el-button>
      <el-button @click="upload('个性FAQ')">
        <el-progress type="circle" :percentage="marked.个性FAQ/cqas_length*100" status="text" color="#87dc5c">个性CQA</el-progress>
      </el-button>
      <el-button @click="upload('待定FAQ')">
        <el-progress type="circle" :percentage="marked.待定FAQ/cqas_length*100" status="text" color="#b6b5b5">待定CQA</el-progress>
      </el-button>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
export default {
  name: 'cqa',
  data () {
    return {
      // 从服务器上获取到的cqas
      all_cqas: [],
      // 显示在页面上的cqa
      cqas:{
        'ID': "",
        'context': "",
        'question': "",
        'answer': "",
      },
      filename: '',
      // 句子位置标识符
      index: 0, 
      // cqas的长度
      cqas_length: 1,
      marked_process: [],
      color_process: [],
      color_map: {
        "通用FAQ": "#f0b255",
        "个性FAQ": "#87dc5c",
        "待定FAQ": "#b6b5b5",
        "删除FAQ": "#ff7963"
      },
      code: 0,
      filename: '',
      marked: {
        "通用FAQ": 0,
        "个性FAQ": 0,
        "待定FAQ": 0,
        "删除FAQ": 0,
        '进度': 0
      },
      marked_id: 0
    }
  },
  computed: {
    // 计算属性的 getter
    CID: function () {
      // `this` 指向 vm 实例
      return 'C' + this.cqas.ID
    },
    QID: function () {
      // `this` 指向 vm 实例
      return 'Q' + this.cqas.ID
    },
    AID: function () {
      // `this` 指向 vm 实例
      return 'A' + this.cqas.ID
    }
  },

  created: function() {

    var _this = this;
      document.onkeydown = function(e) {
        let key = window.event.keyCode;
        if (key == 38 || key == 37) {
          _this.up();
        }else if(key == 40 || key == 39){
          _this.down();
        }
      };
  },


  methods: {
    
    // 回到进度条位置
    back(){
      if(this.cqas.question == ""){
        this.$message({
          message: "data error",
          type: "error",
          duration: 1500
        });
        return
      }else if(this.marked_id == this.cqas_length){
        this.index=this.marked_id-1
        this.cqas=this.all_cqas[this.marked_id-1]
        return 
      }
      this.index=this.marked_id
      this.cqas=this.all_cqas[this.marked_id]
    },

    up(){
      if(this.index == 0){
        this.$message({
            message: "已经是第一个了",
            type: "error",
            duration: 2000
        });
        return
      }
      this.index -= 1
      // console.log('index:' + this.index)
      this.cqas =  this.all_cqas[this.index]
    },

    getFileName(file, fileList){
      this.filename = file.name
    },

    submitUpload() {
        this.$refs.upload.submit();
      },

    uploadSuccess(response){
      console.log(response)
      if(response["code"] == 200){
        // 获取所有cqa
        this.all_cqas = response["content"]
        // 获取cqa的长度
        this.cqas_length = this.all_cqas.length
        // 获取已标注
        this.marked_process = response["category"]
        // 统计已标注
        for(var key of this.marked_process){
          this.color_process.push(this.color_map[key])
          this.marked[key] += 1
        }
        // 计算当前标注位置
        this.marked_id = this.marked_process.length
        if(typeof(this.marked_id) == 'undefine'){
          this.marked_id = 0
        }
        this.index=this.marked_id
        if(this.marked_id == this.cqas_length){
          this.$message({
            message: "该份文件标完了",
            type: "error",
            duration: 2000
          });
        }
        // 如果存在历史记录
        if(this.marked_id > 0 && this.marked_id < this.cqas_length){
          // this.index -= 1
          this.cqas = this.all_cqas[this.marked_id]
        // 如果不存在
        }else if(this.marked_id == 0){
          this.cqas = this.all_cqas[0]
        }
        console.log('index: ' + this.index)
        console.log('marked_id: ' + this.marked_id)
        console.log('cqas_length: ' + this.cqas_length)
      }

      else{
          // 文件上传错误的情况
          this.$message({
            message: response["content"],
            type: "error",
            duration: 2000
        });
      }
    },
    down(){
      // console.log(this.index, this.marked_id)
      if(this.index == this.cqas_length-1){
        this.$message({
            message: "已经是最后一个了",
            type: "error",
            duration: 2000
        });
        return
      }else if(this.index == this.marked_id){
        this.$message({
            message: "你这条还没标",
            type: "error",
            duration: 2000
        });
        return 
      }else{
        this.index += 1
        this.cqas = this.all_cqas[this.index]
      }
    },

    // 按钮函数
    upload: function (category) {
      if(this.marked_id == this.cqas_length && this.index == this.cqas_length){
        this.$message({
          message: "标完了",
          type: "error",
          duration: 1500
        });
        return
      }
      if(this.cqas.question == ""){
        this.$message({
          message: "data error",
          type: "error",
          duration: 1500
        });
        return
      }

      const url = "http://localhost:8001/category/";
      // const url = "http://47.100.226.195:8001/category/";
      // const url = "http://127.0.0.1:8001/category/";
      var params = new URLSearchParams()
      params.append("ID", this.cqas.ID)
      params.append("question", this.cqas.question)
      params.append("answer", this.cqas.answer)
      params.append("context", this.cqas.context)
      params.append("filename", this.filename)
      params.append("category", category)

      this.$axios({
        method: "POST",
        url: url,
        data: params
      }).then(response => {
        console.log(response["data"])
        this.code=response["data"]["code"] 
        if(response["data"]["code"] == 200){
          // 对当前标注句子赋值
          this.marked_process[this.marked_id] = category
          // 下跳句子
          this.marked_id += 1
          this.index = this.marked_id
          // 统计句子个数
          this.marked[category] += 1
          this.$message({
            message: category,
            type: "success",
            duration: 1500
          });
          if(this.marked_id == this.cqas_length){
            this.$message({
              message: category + ' ' + "标完了",
              type: "success",
              duration: 1500
            });
          }
        }else if(response["data"]["code"] == 201){
          // 更新环形进度条
          this.marked[category]+=1
          this.marked[response["data"]["marked"]]-=1
          // 添加当前session标注list
          this.marked_process[this.index] = category

          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1500
          });
          return
        }else{
          this.$message({
            message: response["data"]["content"],
            type: "error",
            duration: 1500
          });
        }

        console.log(this.marked_id, this.cqas_length, this.index)

        if (this.marked_id == this.cqas_length){
          // 修复最后一条标注无tag bug
          console.log(this.marked_id)
          this.marked_process[this.marked_id] = category
          this.index = this.marked_id-1
          return
        }
        // console.log(this.marked_id)
        this.cqas = this.all_cqas[this.marked_id]
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .main{
    display: flex;
    justify-content: center;
    flex-direction: column;
    flex-wrap: wrap;
    padding-left: 2%;
    width: 100%;
    height:100%;
  }
  .upload{
    width: 20%;
    margin-bottom: 10px;
    /* height: 20%; */
  }
  .button-tool{
    display: flex;
    justify-content: center;
    width:70%;
    line-height:30px;
    list-style:none;
    padding: 0px;
  }
  .ID{
    color: red;
  }
  .percent{
    margin-top: 15px;
    display: flex;
    justify-content: center;
    width: 70%;
    flex-wrap: wrap;
  }

  .percent button{
    width: 166px;
    height: 160px;
    border-radius: 80px;
    border: none;
    /* background-color: rgb(204, 232, 207); */
  }
</style>

<style>
#leftBox .el-textarea .el-textarea__inner{
  min-height: 40px !important;
  border-radius: 4px;
  padding-top: 10px;
  /* background-color: rgb(204, 232, 207); */
  border-color: #A3A3A3;
}
.el-textarea.is-disabled .el-textarea__inner{
  color: #787878;
  /* background-color: rgb(204, 232, 207); */
  border-color: #A3A3A3;
}
.el-input.is-disabled .el-input__inner{
  color: #8A8A8A;
  font-size: 16px;
  /* background-color: rgb(204, 232, 207); */
  border-color: #A3A3A3;
}
</style>

