<template>
  <div class="main">
    <div class="left">
      <!-----------------------          搜索框          ----------------------->
      <div class="banner">
        <el-input
          type="text"
          v-model="question"
          style="width: 760px;"
          placeholder
          v-on:keyup.enter.native="questionSearch()"
        ></el-input>
        <el-button style="min-width:100px;" type="primary" @click="questionSearch()">搜索</el-button>
      </div>
      <div class="cqa" @mousewheel="selectNextPage">
        <el-scrollbar>
          <div
            v-for="cqa in allCqas.slice($store.state.dataInfo.currentLocation, $store.state.dataInfo.currentLocation + 4)"
            :key="cqa.id"
            style="margin-bottom: 40px; border:1px solid #D5D5D5;"
          >
            <el-input v-model="cqa.context" type="textarea" autosize placeholder="多个Context用空格隔开"></el-input>
            <el-input v-model="cqa.question" type="textarea" autosize></el-input>
            <el-input v-model="cqa.answer" type="textarea" autosize></el-input>
            <div>
              <el-button
                class="circle-button"
                v-for="label in cqaLabels"
                :class="label == cqa.label ? colorMap[label]: ''"
                :key="label.id"
                :value="label"
                @click="cqaLabelUpdate(cqa, label)"
              >{{ label }}</el-button>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <div class="right">
      <span class="result-prompt">搜索结果：</span>
      <div class="search-result">
        <ul
          class="qagroup"
          v-for="result in searchResult"
          :key="result.id"
          @click="clickResult(result)"
        >
          <li>c：{{ result.context }}</li>
          <li>q：{{ result.question }}</li>
          <li>a：{{ result.answer }}</li>
          <li>label：{{ result.label }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */
export default {
  name: "cqa",
  data() {
    return {
      url: "",
      question: "",
      searchResult: [],
      allCqas: [],
      cqaLabels: ["通用FAQ", "删除FAQ", "个性FAQ"],
      colorMap: {
        通用FAQ: "color-B",
        删除FAQ: "color-D",
        个性FAQ: "color-C"
      }
    };
  },
  computed: {},

  created: function() {
    this.url = this.$getUrl();

    this.$axios({
      method: "GET",
      url: this.url + "reqFromFileName/",
      params: {
        filename: this.$store.state.dataInfo.filename
      }
    }).then(res => {
      if (res["data"]["code"] == 200) {
        this.uploadSuccess(res["data"]);
      } else {
        this.$message({
          message: "数据已经被别人领了",
          type: "error",
          duration: 2000
        });
      }
    });
  },

  methods: {
    clickResult(result) {
      this.$store.state.dataInfo.currentLocation = result["index"];
    },

    uploadSuccess(response) {
      console.log(response["data"]);
      if (response["code"] == 200) {
        this.$store.state.dataInfo.filename = response["filename"];
        this.allCqas = response["data"];
        var markedCount = 0;
        for (let i = 0; i < this.allCqas.length; i++) {
          this.allCqas[i]["id"] = i;
          if (this.allCqas[i]["label"] == "") {
            this.allCqas[i]["marked"] = "sentence-no-mark";
          } else {
            this.allCqas[i]["marked"] = "sentence-mark";
            markedCount += 1;
          }
        }

        // 数据/当前文件 基础信息
        this.$store.state.dataInfo.currentLocation = 0;
        this.$store.state.dataInfo.dataNum = this.allCqas.length;
        this.$store.state.dataInfo.marked = markedCount;
        this.$store.state.dataInfo.unmark = this.allCqas.length - markedCount;
        // 标注信息统计
        this.$store.state.dataInfo.dataMarkedInfo = this.allCqas;
      } else {
        // 文件上传错误的情况
        this.$message({
          message: response["message"],
          type: "error",
          duration: 2000
        });
      }
    },

    selectNextPage(e) {
      if (e["deltaY"] > 0) {
        if (
          this.$store.state.dataInfo.currentLocation >=
          this.allCqas.length - 1
        ) {
          // this.$message({
          //   message: "已经是最后一个了",
          //   type: "error",
          //   duration: 2000
          // });
          this.$store.state.dataInfo.currentLocation = this.allCqas.length - 1;
          return;
        } else {
          this.$store.state.dataInfo.currentLocation += 4;
        }
      } else {
        if (this.$store.state.dataInfo.currentLocation <= 0) {
          // this.$message({
          //   message: "已经是第一个了",
          //   type: "error",
          //   duration: 2000
          // });
          this.$store.state.dataInfo.currentLocation = 0;
          return;
        }
        this.$store.state.dataInfo.currentLocation -= 4;
      }
    },

    questionSearch() {
      this.searchResult = [];
      // 首先判断是否是index搜索
      if (this.question.indexOf("index:") == 0) {
        var index = parseInt(this.question.substring(6));
        this.$store.state.dataInfo.currentLocation = index;
        this.question = "";
        return;
      } else {
        if (this.question.length == 0) {
          for (let i = 0; i < this.allCqas.length; i++) {
            if (this.$store.state.dataInfo.dataMarkedInfo[i]["marked"] == 'sentence-no-mark') {
              let tmp = this.allCqas[i];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            }
          }
          return;
        }
        // 判断上传的所有数据里面是否有符合搜索条件的句子
        for (let i = 0; i < this.allCqas.length; i++) {
          if (
            this.allCqas[i]["question"].match(this.question) ||
            this.allCqas[i]["answer"].match(this.question) ||
            this.allCqas[i]["context"].match(this.question) ||
            this.allCqas[i]["label"].toString().match(this.question)
          ) {
            let tmp = this.allCqas[i];
            tmp["index"] = i;
            this.searchResult.push(tmp);
          } else {
            // console.log(this.searchResult)
            continue;
          }
        }
        // this.searchResult.reverse();
        // console.log(this.searchResult);
        if (this.searchResult.length > 0) {
          this.question = "";
          // console.log(this.searchResult);
          return;
        }
        this.$message({
          message: "未能找搜索到任何结果",
          type: "error",
          duration: 2000
        });
        return;
      }
    },

    // 按钮函数
    cqaLabelUpdate(cqa, label) {
      const url = this.url + "mark/";
      var params = new URLSearchParams();
      params.append("uuid", cqa.uuid);
      params.append("question", cqa.question);
      params.append("answer", cqa.answer);
      params.append("context", cqa.context);
      params.append("filename", this.$store.state.dataInfo.filename);
      params.append("category", label.toString());

      this.$axios({
        method: "POST",
        url: url,
        data: params
      })
        .then(response => {
          // console.log(response["data"]);
          if (response["data"]["code"] == 200) {
            // 更新标签信息
            this.allCqas[cqa.id]["color"] = this.colorMap[label];
            this.$store.state.dataInfo.dataMarkedInfo[cqa.id]["marked"] =
              "sentence-mark";
            this.allCqas[cqa.id]["label"] = [label];
            // console.log(this.flipCqa);
            this.$message({
              message: response["data"]["message"],
              type: "success",
              duration: 1500
            });
          } else {
            this.$message({
              message: response["data"]["message"],
              type: "error",
              duration: 1500
            });
            return;
          }
        })
        .catch(error =>
          this.$alert("" + error, "接口异常", {
            confirmButtonText: "确定",
            type: "error"
          })
        );
    }
  }
};
</script>

<style scoped>
.main {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.cqa {
  position: relative;
  width: 866px;
  height: 690px;
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  border-radius: 5px;
}

.banner {
  width: 870px;
  margin-bottom: 10px;
}

.left {
  background-color: white;
  width: 900px;
  padding-left: 40px;
  padding-right: 20px;
}

.right {
  width: 380px;
  border-left: thick solid #b5b5b5;
  border-left-width: 10px;
  padding-left: 20px;
  padding-right: 20px;
  /* padding-top: 50px; */
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
  height: 690px;
  width: 380px;
  border: 1px solid rgb(218, 218, 218);
  overflow-y: scroll;
  border-radius: 5px;
}

.result-prompt {
  width: 377px;
  height: 40px;
  display: inline-block;
  line-height: 40px;
  background-color: rgb(28, 169, 224);
  color: white;
  border-radius: 5px;
  padding-left: 5px;
  /* text-align: center; */
  margin-bottom: 8px;
}

.circle-button {
  margin-right: 10px;
  font-size: 16px;
  font-weight: 600;
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
</style>

<style>
</style>

