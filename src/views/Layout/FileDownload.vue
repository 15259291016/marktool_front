<template>
  <div class="main">
    <br />
    <!-----------------------          搜索框          ----------------------->
    <div style="margin:0 auto; margin-top: -20px;">
      <el-input
        type="text"
        v-model="filename"
        style="width: 730px; margin-right:5px;"
        v-on:keyup.enter.native="filenameSearch()"
      ></el-input>
      <el-button style="width:100px;" @click="filenameSearch()">搜索</el-button>
    </div>
    <el-table
      style="height: 758px; overflow-y: scroll;"
      :data="fileList"
      ref="multipleTable"
      :row-key="getRowKeys"
      @selection-change="handleSelectionChange"
    >
      <!-- 选择器 -->
      <el-table-column type="selection" width="60" :reserve-selection="true"></el-table-column>

      <!-- 文件名称 -->
      <el-table-column prop="file" label="文件名称" min-width="60"></el-table-column>

      <!-- 标注数 -->
      <el-table-column prop="marked" label="标注数" min-width="40" align="center"></el-table-column>

      <!-- 总行数 -->
      <el-table-column prop="total" label="总行数" min-width="40" align="center"></el-table-column>

      <!-- 标注进度 -->
      <el-table-column prop="marked" label="标注进度" width="200">
        <template slot-scope="scope">
          <el-progress
            :text-inside="true"
            :stroke-width="18"
            :percentage="Math.floor(scope.row.marked/scope.row.total*100)"
          ></el-progress>
        </template>
      </el-table-column>

      <el-table-column el-table-column label="操作" align="center">
        <template slot-scope="scope">
          <i>
            <el-button
              size="mini"
              type="primary"
              @click="check(scope.row), dialogTableVisible = true"
            >
              <i class="el-icon-view"></i>
            </el-button>
          </i>
          <i>
            <!-- 下载按钮 -->
            <!-- 0 标注  -->
            <!-- 1 允许下载自己的单份文件  -->
            <!-- 2 允许下载所有的文件  -->
            <!-- 3 允许上传 下载 删除  -->
            <el-button size="mini" type="general" @click="FileDownload(scope.row)" :disabled="(permission==1 && scope.row.file.indexOf(zh_name) > -1) || permission > 1 ? false: true">
              <i class="el-icon-download"></i>
            </el-button>
          </i>
          <i>
            <!-- 删除按钮 -->
            <el-button size="mini" type="danger" @click="handleDelete(scope.row)" :disabled="permission>2? false: true">
              <i class="el-icon-delete"></i>
            </el-button>
          </i>
          <el-dialog
            :title="checkFile"
            :visible.sync="dialogTableVisible"
            :lock-scroll="false"
            v-if="checkFile.split('.')[1] != 'cqa'"
          >
            <!-- <el-button @click="toTest()">给测试大佬</el-button> -->
            <el-table :data="checkData" style="height: 60vh; overflow: auto;">
              <el-table-column property="index" label="索引" width="80"></el-table-column>
              <el-table-column property="sentence" label="句子" min-width="200"></el-table-column>
              <el-table-column property="label" label="标签">
                <template slot-scope="scope">
                  <el-select size="medium" v-model="scope.row.label">
                    <el-option
                      v-for="cls in classes"
                      :key="cls.id"
                      :value="cls.text"
                      @click.native="update_label(scope.row.uuid, scope.row.file, scope.row.label)"
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
            </el-table>
          </el-dialog>
          <el-dialog
            :title="checkFile"
            :visible.sync="dialogTableVisible"
            :lock-scroll="false"
            v-if="checkFile.split('.')[1] == 'cqa'"
          >
            <el-table :data="checkData" style="height: 60vh; overflow: auto;">
              <el-table-column property="index" label="索引" width="80"></el-table-column>
              <el-table-column property="context" label="context" min-width="100"></el-table-column>
              <el-table-column property="question" label="question" min-width="100"></el-table-column>
              <el-table-column property="answer" label="answer" min-width="200"></el-table-column>
              <el-table-column property="label" label="标签" min-width="80">
                <template slot-scope="scope">
                  <el-select size="medium" v-model="scope.row.label">
                    <el-option
                      v-for="cqa in cqas"
                      :key="cqa.id"
                      :value="cqa"
                      :disabled="permission>0? false: true"
                      @click.native="update_label(scope.row.uuid, scope.row.file, scope.row.label, scope.row.context, scope.row.action)"
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
            </el-table>
          </el-dialog>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="width:70%; height: 20px;"
      background
      layout="prev, pager, next, total"
      :page-size="pagesize"
      :total="fileLength"
      @current-change="handleCurrentChange"
    ></el-pagination>

    <div style="display: flex; justify-content: center; margin-top: 10px;">
      <el-button style="margin:0 auto; width: 50%" type="primary" @click="FilesDownload" :disabled="permission>1? false: true">
        下载
        <i class="el-icon-upload el-icon--right"></i>
      </el-button>
      <el-button style="margin:0 auto; width: 50%;background-color: red;" type="primary" @click="QualityDownload" :disabled="permission>1? false: true">
        质检
        <i class="el-icon-upload el-icon--left"></i>
      </el-button>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: "qa_system",
  data() {
    return {
      cqas: ["通用FAQ", "删除FAQ", "个性FAQ"],
      permission: -1,
      zh_name: "",
      serve: "",
      department_: "",
      classes: [],
      checkFile: "",
      dialogTableVisible: false,
      checkData: [],
      filename: "",
      pagesize: 10,
      currpage: 1,
      fileLength: 0,
      multipleSelection: [],
      fileList: [],
      url: "",
      mclasseng: "cqa"
    };
  },
  created: function() {
    // 初始化文件详情全局变量
    var dataInfo = {
      // 文件名
      filename: '',
      // 文件类型
      mclass: this.$store.state.dataInfo.mclass,
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
    }
    this.$store.state.dataInfo = dataInfo

    this.url = this.$getUrl();

    this.$axios({
      method: "GET",
      url: this.url + "getUserInfo/",
    }).then(res => {
      if (res["data"]["code"] === 200) {
        this.zh_name = res["data"]["content"]["zh_name"]
        this.permission = res["data"]["content"]["permission"]
        sessionStorage.setItem("permission", this.permission)

      } else {
        this.$message({
          message: res["data"]["content"],
          type: "error",
          duration: 3000
        });
        localStorage.removeItem("token")
        this.$router.push('/Login')
      }
    });

    this.queryList();

    this.$axios({
      method: "GET",
      url: this.url + "getFileLength/",
      params: {
          mclasseng: this.mclasseng
        }
    }).then(res => {
      if (res["data"]["code"] === 200) {
        this.fileLength = parseInt(res["data"]["data"]);
      }
    });

    this.permission = sessionStorage.getItem("permission");
    if (this.permission === -1){
      this.permission = this.$store.state.user.permission
    }
    if (this.$store.state.dataInfo.mclass ==='mainpage'){
      this.$store.state.dataInfo.mclass='classification'
    }
    this.$axios({
      method:"GET",
      url:this.url+"filenameSearch/",
      params:{
        filename:this.$store.state.dataInfo.mclass,
        server:this.$store.state.dataInfo.mclass
      }
    }).then(res=>{
      console.log("fileDownload")
      // debugger

      this.fileList = res['data']['data'];
      this.fileLength=this.fileList.length;
    })
  },
  methods: {
    queryList() {
      this.$axios({
        method: "GET",
        url: this.url + "queryList/",
        params: {
          pagesize: this.pagesize,
          currpage: this.currpage,
          mclasseng: this.mclasseng
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.fileList = res["data"]["data"];
        }
      });
    },

    filenameSearch() {
      this.$axios({
        method: "GET",
        url: this.url + "filenameSearch/",
        params: {
          filename: this.filename,
          pagesize: 50,
          currpage: this.currpage,
          server: this.$store.state.dataInfo.mclass
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.fileList = res["data"]["data"];
          // this.filename = "";
          this.fileLength = this.fileList.length

          this.$message({
            message: "搜索成功",
            type: "success",
            duration: 2000
          });
          return;
        } else {
          this.$message({
            message: "未能找搜索到任何结果",
            type: "error",
            duration: 2000
          });
        }
      });
    },
    getRowKeys(row) {
      return row.id;
    },
    handleCurrentChange(currpage) {
      this.currpage = currpage;
      if (this.filename === ""){
        this.queryList();
      }
    },

    // 表格被选中项变化触发
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },

    update_label(id, file, label, c, a) {
      const url = this.url + "mark/";
      var params = new URLSearchParams();
      if (file.split(".")[1] == "cqa") {
        params.append("uuid", id);
        params.append("answer", a);
        params.append("context", c);
        params.append("filename", file);
        params.append("category", label);
      } else {
        params.append("uuid", id);
        params.append("filename", file);
        params.append("label", label);
      }

      this.$axios({
        method: "POST",
        url: url,
        data: params
      }).then(response => {
        this.$message({
          message: response["data"]["content"],
          type: "success",
          duration: 1500
        });
      });
    },

    check(row, column, event, cell) {
      var filename = row["file"];
      var department = filename.split("_")[0]
      var precent = parseInt(this.filename);
      this.checkFile = filename;
      this.department_ = filename.split("_")[0];
      this.serve = filename.split(".")[1];

      this.filename = "";
      if (isNaN(precent) === true) {
        precent = 20;
      } else if (precent > 100) {
        precent = 100;
      } else if (precent < 1) {
        precent = 1;
      }

      if (filename.split(".")[1] !== "cqa") {
        this.$axios({
          method: "GET",
          url: this.url + "ReadConfig/",
          params: {
            department: this.department
          }
        }).then(res => {
          if (res["data"]["code"] === 200) {
            this.classes = res["data"]["data"]["config"]["classification"];
          }
        });
      }

      this.$axios({
        method: "GET",
        url: this.url + "checkFile/",
        params: {
          filename: filename,
          precent: precent
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.checkData = res["data"]["data"];
          this.filename = "";
        }
      });
    },

    toTest() {
      let toTestString = JSON.stringify(this.checkData);

      var params = new URLSearchParams();
      params.append("jsonString", toTestString);
      this.$axios({
        method: "POST",
        url: this.url + "toTest/",
        data: params
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.$message({
            message: res["data"]["message"],
            type: "success",
            duration: 1500
          });
        }
      });
    },

    // 下载单份文件按钮
    FileDownload(row) {
      window.location.href = this.url + "FileDownload/?file=" + row.file;
    },

    // 下载选中文件
    FilesDownload() {
      let downloadList = [];
      if (this.multipleSelection.length === 0) {
        this.$message.error("请先选择文件");
        return;
      } else {
        for (let i = 0; i < this.multipleSelection.length; i++) {
          if (
            this.multipleSelection[i].marked !== this.multipleSelection[i].total
          ) {
            this.$message.error(
              "批量选择的文件内含有未标注完的文件，请重新选择"
            );
            // return
          }
          downloadList.push(this.multipleSelection[i].file);
        }
        var params = new URLSearchParams();
        params.append("files_", downloadList);
        this.$axios({
          method: "POST",
          url: this.url + "FilesDownload_/",
          data: params
        }).then(res => {
          if (res["data"]["code"] === 200) {
            window.location.href = this.url + "FilesDownload/";
            this.$refs.multipleTable.clearSelection();
          }
        });
      }
    },
    QualityDownload() {
      let downloadList = [];
      if (this.multipleSelection.length === 0) {
        this.$message.error("请先选择文件")
        return
      } else {
        for (let i = 0; i < this.multipleSelection.length; i++) {
          if (
            this.multipleSelection[i].marked !== this.multipleSelection[i].total
          ) {
            this.$message.error(
              "批量选择的文件内含有未标注完的文件，请重新选择"
            )
          }
          downloadList.push(this.multipleSelection[i].file)
        }
        var params = new URLSearchParams()
        params.append("files_", downloadList)
        this.$axios({
          method: "POST",
          url: this.url + "QualityDownload/",
          data: params
        }).then(res => {
          if (res["data"]["code"] === 200) {
            window.location.href = this.url + "FilesDownload/"
            this.$refs.multipleTable.clearSelection()
          }
        });
      }
    },

    // 删除按钮
    handleDelete(row) {
      var params = new URLSearchParams();
      params.append("file", row["file"]);

      this.$confirm("此操作将永久删除 《" + row["file"] + "》 , 是否继续?", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.$axios({
            method: "POST",
            url: this.url + "deleteFile/",
            data: params
          }).then(res => {
            if (res["data"]["code"] === 200) {
              for (var i = 0; i < this.fileList.length; i++) {
                if (row["file"] === this.fileList[i]["file"]) {
                  this.fileList.splice(i, 1);
                }
              }
              this.$message({
                type: "success",
                message: res["data"]["content"]
              });
            } else {
              this.$message({
                type: "error",
                message: res["data"]["content"]
              });
            }
          });
          this.filenameSearch();
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });

    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  width: 850px;
  margin: 0 auto;
  overflow-y: auto !important;
}
.input_area {
  width: 45%;
}
.history_area {
  width: 50%;
}
.history_area .history_area_ul {
  padding-left: 10%;
  text-decoration: none;
  list-style: decimal;
  text-align: left;
  line-height: 50px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
}
.el-icon-arrow-down {
  font-size: 12px;
}
</style>

<style>
/* .inputBackground{
    background:cyan;
  } */
</style>
