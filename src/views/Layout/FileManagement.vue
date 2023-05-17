<template>
  <div style="width:90%; margin: 0 auto;">
    <el-tabs type="card" stretch:true v-model="activeName" @tab-click="getactiveName">
      <el-tab-pane label="文件上传" name="first" v-if="$store.state.user.permission < 2? false:true" @click="getactiveName"></el-tab-pane>
      <el-tab-pane label="已标注" name="second" @click="getactiveName"></el-tab-pane>
      <el-tab-pane label="待领取" name="third" @click="getactiveName"></el-tab-pane>
       <el-tab-pane label="质检中心" name="fourth" v-if="$store.state.user.permission < 2? false:true" @click="getactiveName"></el-tab-pane>
    </el-tabs>
    <div>
      <!-- 文件上传 -->
      <div v-if="activeName === '文件上传'" class="upload">
        <el-upload
          drag
          :headers="header"
          :action="uploadurl"
          ref="upload"
          multiple
          :auto-upload="false"
          :on-success="uploadSuccess"
          :limit="1"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或
            <em>点击上传</em>
          </div>
          <div class="el-upload__text">
            <br />配置文件名：科室_功能.xlsx
            <br />beauty_ner.xlsx
            <br />beauty_classification.xlsx
            <br />beauty_relation.xlsx
            <br />beauty_attribute.xlsx
            <br />beauty_multiclassification.xlsx
            <br />
            <br />标注文件名：科室_姓名_数量_备注.classification
            <br />beauty_name_1000_备注.classification
            <br />beauty_张三_0_备注.classification
          </div>
        </el-upload>
        <el-button class="upload-btn" size="small" type="success" @click="submitUpload">上传到服务器</el-button>
      </div>

      <!-- 已标注 -->
      <div v-else-if="activeName === '已标注'">
          <el-tag
            class="class-name"
            :type="data.status"
            v-for="(data, each) in unMarkFiles"
            :key="each.id"
            @click="selectFileClass(each, 'unMarkFiles')"
          >{{ each }}</el-tag>
          <el-table
            :data="UserNotEmptyFile"
            style="width: 100%; overflow-y: scroll;"
            max-height="600"
            v-loading="loading"
          >
            <el-table-column prop="file" label="文件名称" width="360"></el-table-column>
            <el-table-column label="标注进度" width="200">
              <template slot-scope="scope">
                <el-progress
                  color="rgb(160, 187, 222)"
                  :text-inside="true"
                  :stroke-width="18"
                  :percentage="scope.row.marked === undefined? 0:Math.floor(scope.row.marked/scope.row.total*100)"
                ></el-progress>
              </template>
            </el-table-column>
            <el-table-column prop="last_date" label="最后修改时间" width="150"></el-table-column>
            <el-table-column prop="is_check" label="是否提交质检" width="120"></el-table-column>
            <el-table-column prop="is_pass" label="是否通过" width="100"></el-table-column>
            <el-table-column label="操作" width="150">
              <template slot-scope="scope">
                <i>
                  <el-tooltip content="标注" placement="top" effect="light">
                    <el-button size="mini" type="primary" @click="toAnnatator(scope.row.file)">
                      <i class="el-icon-edit"></i>
                    </el-button>
                  </el-tooltip>
                </i>
                <el-divider direction="vertical"></el-divider>
                <i>
                  <el-tooltip content="提交质检" placement="top" effect="light">
                    <el-button
                      size="mini"
                      type="warning"
                      @click="submitCheck(scope.row)"
                    >
<!--                      :disabled="$store.state.user.permission > 2? true: false"-->
                      <i class="el-icon-s-check"></i>
                    </el-button>
                  </el-tooltip>
                </i>
              </template>
            </el-table-column>
          </el-table>
        </div>

      <!-- 待领取 -->
      <div v-else-if="activeName === '待领取' && Object.keys(unNameFiles).length > 0">
        <el-tag
          class="class-name"
          :type="data.status"
          v-for="(data, each) in unNameFiles"
          :key="each.id"
          @click="selectFileClass(each, 'unNameFiles')"
        >{{ each }}</el-tag>
        <ul class="data-show" v-if="$store.state.dataInfo.mclass !== 'twotuples' || $store.state.dataInfo.mclass !== 'graph'">
          <li>
            <div class="filename-show">文件名</div>
            <div class="edit-btn">操作</div>
          </li>
          <el-divider></el-divider>
          <li
            v-for="file in unNameFiles[$store.state.fileManager.unNameFilesClassName]['data']"
            :key="file.id"
          >
            <div class="filename-show">{{file.value}}</div>
            <div class="edit-btn">
              <el-button size="mini" type="primary" @click="toAnnatator(file.value)">
                <i class="el-icon-edit"></i>
              </el-button>
            </div>
            <el-divider></el-divider>
          </li>
        </ul>
        <ul class="data-show" v-else>
          <li>
            <div class="filename-show">文件名</div>
            <div class="edit-btn">操作</div>
          </li>
          <el-divider></el-divider>
          <li
            v-for="file in unNameFiles[$store.state.fileManager.unNameFilesClassName]['data']"
            :key="file['value']"
          >
            <div class="filename-show">{{file.value}}</div>
            <div class="edit-btn">
              <el-button size="mini" type="primary" @click="toAnnatator(file.value)">
                <i class="el-icon-edit"></i>
              </el-button>
            </div>
            <el-divider></el-divider>
          </li>
        </ul>
      </div>
      <!-- 质检中心 -->
      <div v-else-if="activeName === '质检中心' && Object.keys(checkFiles).length > 0">
        <el-tag
          class="class-name"
          :type="data.status"
          v-for="(data, each) in checkFiles"
          :key="each.id"
          @click="selectFileClass(each, 'unCheckFiles')"
        >{{ each }}</el-tag>
        <ul class="data-show checker-center">
          <li>
            <div class="filename-show">文件名</div>
            <div class="edit-btn">提交人</div>
            <div class="edit-btn date">提交时间</div>
            <div class="edit-btn">最后一次准确率</div>
            <div class="edit-btn">是否通过</div>
            <div class="edit-btn">操作</div>
          </li>
          <el-divider></el-divider>
          <li
            v-for="file in checkFiles[$store.state.fileManager.checkFilesClassName]['data']"
            :key="file.id"
          >
          <el-divider></el-divider>
            <div class="filename-show">{{ file.filename }}</div>
            <div class="edit-btn">{{ file.creater }}</div>
            <div class="edit-btn date">{{ file.submit_check_date }}</div>
            <div class="edit-btn">0</div>
            <div class="edit-btn">{{ file.is_pass }}</div>
            <div class="edit-btn opreation">
              <!-- 查看 -->
              <el-button size="mini" type="primary" @click="toAnnatator(file.filename)">
                <i class="el-icon-view"></i>
              </el-button>
              <el-divider direction="vertical"></el-divider>
              <!-- 质检 -->
              <el-button size="mini" type="warning" @click="check(file.filename)">
                <i class="el-icon-edit"></i>
              </el-button>
              <el-divider direction="vertical"></el-divider>
              <!-- 质检通过 -->
              <el-button size="mini" type="success" @click="caculateRate(file.filename)">
                <i class="el-icon-check"></i>
              </el-button>
            </div>
            <el-divider></el-divider>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
export default {
  name: "filemanagement",

  data() {
    return {
      header: {
        Authorization: "Bearer " + localStorage.getItem("token") || ""
      },
      url: "",
      uploadurl: "",
      loading: false,
      unMarkFiles: {},
      unNameFiles: {},
      checkFiles: {},
      UserNotEmptyFile: [{}],
      activeName: "已标注"
    };
  },

  methods: {
    submitCheck(row) {
      if (row.is_check === "是") {
        this.$message({
          message: "切勿重复提交",
          type: "error",
          duration: 1000
        });
        return;
      }
      if (Math.floor((row.marked / row.total) * 100) < 100) {
        this.$message({
          message: "没标完",
          type: "error",
          duration: 1000
        });
        return;
      } else {
        this.$axios({
          method: "GET",
          url: this.url + "submitCheck/",
          params: {
            filename: row.file,
            zh_name: this.$store.state.user.zh_name
          }
        }).then(res => {
          if (res["data"]["code"] === 200) {
            this.$message({
              message: res["data"]["message"],
              type: "success",
              duration: 1000
            });
            row.isCheck = "是";
          } else {
            this.$message({
              message: res["data"]["message"],
              type: "error",
              duration: 1000
            });
          }
        });
      }
    },

    selectFileClass(className, _) {
      this.loading = true;
      if (_ === "unMarkFiles") {
        // 待标注数据
        this.$set(
          this.unMarkFiles[this.$store.state.fileManager.unMarkFilesClassName],
          "status",
          "success"
        );
        this.$store.state.fileManager.unMarkFilesClassName = className;
        this.$set(this.unMarkFiles[className], "status", "danger");
        this.reqMarkedDetail(className);
      } else if (_ === "unNameFiles") {
        // 待领取数据
        this.unNameFiles[this.$store.state.fileManager.unNameFilesClassName][
          "status"
        ] = "success";
        this.$store.state.fileManager.unNameFilesClassName = className;
        this.$set(this.unNameFiles[className], "status", "danger");
      } else {
        this.checkFiles[this.$store.state.fileManager.checkFilesClassName][
          "status"
        ] = "success";
        this.$store.state.fileManager.checkFilesClassName = className;
        this.$set(this.checkFiles[className], "status", "danger");
      }
      this.loading = false;
    },

    reqMarkedDetail(prefix) {
      this.$axios({
        method: "GET",
        url: this.url + "SearchUserNotEmptyFile/",
        params: {
          mclasseng: this.$store.state.dataInfo.mclass,
          zh_name: this.$store.state.user.zh_name,
          prefix: prefix
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.UserNotEmptyFile = res["data"]["data"];
        } else {
          this.$message({
            message: res["data"]["message"],
            type: "error",
            duration: 3000
          });
        }
      });
    },

    toAnnatator(filename) {
      this.$store.state.dataInfo.filename = filename;
      if (this.$store.state.dataInfo.mclass === "classification") {
        this.$router.push("./Classification");
      } else if (this.$store.state.dataInfo.mclass === "graph") {
        this.$router.push("./Graph");
      } else if (this.$store.state.dataInfo.mclass === "cqa") {
        this.$router.push("./Cqa");
      } else if (this.$store.state.dataInfo.mclass === "twotuples") {
        this.$router.push("./TwoTuples");
      } else  if (this.$store.state.dataInfo.mclass === "multiclassification") {
        this.$router.push("./Multiclassification");
      }
    },

    check(filename) {
      this.$axios({
        method: "GET",
        url: this.url + "check/",
        params: {
          filename: filename
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          filename = res["data"]["data"];
          this.$message({
            message: res["data"]["message"],
            type: "success",
            duration: 1000
          });
          this.toAnnatator(filename);
        } else {
          this.$message({
            message: res["data"]["message"],
            type: "error",
            duration: 3000
          });
        }
      });
    },

    caculateRate(filename) {
      this.$axios({
        method: "GET",
        url: this.url + "caculateRate/",
        params: {
          filename: filename
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          // debugger
          this.$message({
            message: res["data"]["message"],
            type: "success",
            duration: 1000
          });
          window.location.href = this.url + "FilesDownload";
          // this.toAnnatator(filename)
        } else {
          this.$message({
            message: res["data"]["message"],
            type: "error",
            duration: 1000
          });
        }
      });
    },

    uploadSuccess(response) {
      this.$message({
        message: response["message"],
        type: response["message"] === "上传成功" ? "success" : "error",
        duration: 3000
      });
      this.$router.go(0);
    },

    submitUpload() {
      // 上传数据
      this.$refs.upload.submit();
    },

    getactiveName(tab, event) {
      this.activeName = tab["label"];
      this.$store.state.fileManager.activeName = tab["label"];

      // 点击了质检中心按钮
      if (this.activeName === "质检中心") {
        this.$axios({
          method: "GET",
          url: this.url + "QueryCheckFile/"
        }).then(res => {
          if (res["data"]["code"] === 200) {
            this.checkFiles = {};
            // 已标注文件
            for (var i = 0; i < res["data"]["data"].length; i++) {
              var tmp = {};
              if (res["data"]["data"][i]["file"] === "") {
                continue;
              }
              var className = res["data"]["data"][i]["file"].split("_")[0];
              if (!this.checkFiles.hasOwnProperty(className)) {
                this.checkFiles[className] = {};
                this.checkFiles[className]["data"] = [];
                this.checkFiles[className]["status"] = "success";
              }
              tmp["filename"] = res["data"]["data"][i]["file"];
              tmp["creater"] = res["data"]["data"][i]["creater"];
              tmp["is_pass"] = res["data"]["data"][i]["is_pass"];
              tmp["submit_check_date"] =
                res["data"]["data"][i]["submit_check_date"];
              this.checkFiles[className]["data"].push(tmp);
            }
            // 分配初值
            if (className != undefined) {
              if (this.$store.state.fileManager.checkFilesClassName === "") {
                this.$store.state.fileManager.checkFilesClassName = className;
              }
              // this.checkFiles[this.$store.state.fileManager.checkFilesClassName] = {}
              this.checkFiles[
                this.$store.state.fileManager.checkFilesClassName
              ]["status"] = "danger";
            }
          } else {
            this.$message({
              message: res["data"]["message"],
              type: "error",
              duration: 1000
            });
          }
        });
      }
    },

    async getUserInfo() {
      this.$axios({
        method: "GET",
        url: this.url + "getUserInfo/"
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.$store.state.user.zh_name = res["data"]["content"]["zh_name"];
          this.$store.state.user.permission = res["data"]["content"]["permission"];
          sessionStorage.setItem(
            "permission",
            res["data"]["content"]["permission"]
          );
          sessionStorage.setItem(
            "zh_name",
            res["data"]["content"]["zh_name"]
          );
        } else {
          this.$message({
            message: res["data"]["content"],
            type: "error",
            duration: 3000
          });
          localStorage.removeItem("token");
          this.$router.push("/Login");
        }
      });
    },

    // 请求没标注完的文件
    async reqUnMarkFiles(mclasseng, zh_name) {
      this.mclasseng = mclasseng;
      if (zh_name === undefined || zh_name === null) {
        let zh_name = this.$store.state.user.zh_name;
      }
      this.$axios({
        method: "GET",
        url: this.url + "SearchNotEmpty/",
        params: {
          mclasseng: mclasseng,
          zh_name: zh_name
        }
      }).then(res => {
        if (res["data"]["code"] === 200) {
          this.unMarkFiles = {};
          this.unNameFiles = {};
          let className = undefined;
          // 已标注文件
          for (let i = 0; i < res["data"]["data"]["marked"].length; i++) {
            let tmp = {};
            className = res["data"]["data"]["marked"][i]["file"].split("_")[0];
            if (!this.unMarkFiles.hasOwnProperty(className)) {
              this.unMarkFiles[className] = {};
              this.unMarkFiles[className]["data"] = [];
              this.unMarkFiles[className]["status"] = "success";
            }
            tmp["value"] = res["data"]["data"]["marked"][i]["file"];
            tmp["label"] = res["data"]["data"]["marked"][i]["file"];
            this.unMarkFiles[className]["data"].push(tmp);
          }
          // 分配初值
          if (className !== undefined) {
            // 查询是否已经存在这个值
            if (this.$store.state.fileManager.unMarkFilesClassName === "") {
              this.$store.state.fileManager.unMarkFilesClassName = className;
            }
            this.unMarkFiles[
              this.$store.state.fileManager.unMarkFilesClassName
            ] = {};
            this.unMarkFiles[
              this.$store.state.fileManager.unMarkFilesClassName
            ]["status"] = "danger";
            this.reqMarkedDetail(
              this.$store.state.fileManager.unMarkFilesClassName
            );
          }
          className = undefined;
          // 待领取
          for (var j = 0; j < res["data"]["data"]["unname"].length; j++) {
            var tmp_ = {};
            className = res["data"]["data"]["unname"][j]["file"].split("_")[0];
            if (!this.unNameFiles.hasOwnProperty(className)) {
              this.unNameFiles[className] = {};
              this.unNameFiles[className]["data"] = [];
              this.unNameFiles[className]["status"] = "success";
            }
            tmp_["value"] = res["data"]["data"]["unname"][j]["file"];
            tmp_["label"] = res["data"]["data"]["unname"][j]["file"];
            this.unNameFiles[className]["data"].push(tmp_);
          }
          // 分配初值
          if (className !== undefined) {
            if (this.$store.state.fileManager.unNameFilesClassName === "") {
              this.$store.state.fileManager.unNameFilesClassName = className;
            }
            // this.unNameFiles[className] = {};
            this.unNameFiles[className]["status"] = "danger";
          }
        } else {
          this.$message({
            message: res["data"]["message"],
            type: "error",
            duration: 3000
          });
        }
      }).catch(err =>{
        console.log(err)
      });
    }
  },
  computed: {
    mclassChange() {
      return this.$store.state.dataInfo.mclass;
    }
  },
  watch: {
    mclassChange: function(newVal, oldVal) {
      this.$router.go(0)
    }
  },
  mounted() {},
  async created() {
    this.url = this.$getUrl();      //'http://127.0.0.1:8000/'
    this.$store.state.dataInfo.mclass = sessionStorage.getItem("mclass") == null ? "classification" : sessionStorage.getItem("mclass");  //classification
    this.activeName = this.$store.state.fileManager.activeName || "已标注";   //'文件上传'
    this.uploadurl = this.url + "uploadFile/";    //'http://127.0.0.1:8000/uploadFile/'
    await this.getUserInfo();
    await this.reqUnMarkFiles(this.$store.state.dataInfo.mclass, this.$store.state.user.zh_name);
    await this.getactiveName({ label: this.activeName });
    var dataInfo = {
      // 文件名
      filename: "",
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
    };
    this.$store.state.dataInfo = dataInfo;
    this.$store.state.fileManager.unMarkFilesClassName = "";
  }
};
</script>

<style scoped>
.upload {
  width: 360px;
  margin-top: 100px;
  margin: 0 auto;
  margin-top: 50px;
  left: 45%;
}

.upload-btn {
  width: 360px;
}

.filename-show {
  width: 400px;
  display: inline-block;
}

.edit-btn {
  width: 120px;
  display: inline-block;
}

.opreation {
  width: 200px;
}

.date {
  width: 200px;
}

.data-show {
  /* margin: 0 auto; */
  width: 600px;
  font-size: 16px;
  list-style: none;
  line-height: 40px;
  padding: 0px;
  padding-left: 8px;
  padding-right: 8px;
  /* line-height: 30px; */
  /* background-color: #f5f7fa; */
  color: #6c7070;
  /* border: 2px solid rgb(16, 157, 212); */
  /* border-radius: 5px; */
  max-height: 600px;
  overflow-y: scroll;
}

.checker-center {
  width: 1200px;
}

.class-name {
  margin: 5px;
}
</style>

<style>
.el-upload-dragger .el-icon-upload {
  margin: 10px 0 16px;
}
.el-upload-dragger {
  height: auto;
}
</style>
