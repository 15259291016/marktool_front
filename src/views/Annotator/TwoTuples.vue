<template>
  <div class="main">
    <div class="left" @mousewheel="selectNextPage">
      <!-----------------------          搜索框          ----------------------->
      <div style="width:100%; padding-left:10px;">
        <el-input
          type="text"
          v-model="question"
          style="width:calc(100% - 135px); margin-right:5px;"
          placeholder
          v-on:keyup.enter.native="questionSearch()"
        ></el-input>
        <el-button style="min-width:100px;" type="primary" @click="questionSearch()">搜索</el-button>
      </div>

      <div class="textarea">
        <!-- @mouseup="getSelectWord()" -->
        <div
          class="text"
          @mouseup="getSelectWord()"
          v-html="allTupleData[$store.state.dataInfo.currentLocation].sentence"
        ></div>
        <div class="labeled" :v-model="allTupleData[$store.state.dataInfo.currentLocation].label">
          <!-- {{ marked_process[index] }}&emsp;&emsp; -->
          <span
            @contextmenu.prevent="deleteLabel(l)"
            style="padding-left:5px; padding-right:5px;"
            v-for="l in allTupleData[$store.state.dataInfo.currentLocation].label"
            :key="l.id"
          >{{l}}</span>
          <span
            style="position: absolute; right: 30px;"
          >{{ $store.state.dataInfo.currentLocation + 1 }}</span>
        </div>
        <div v-if="catchWords.length != 0">
          <el-popover placement="right-start" width="420" trigger="manual" v-model="nerVisible">
            <el-button
              v-for="(nereng, ner)  in ners"
              :key="ner.id"
              @click="annatatorNer(nereng)"
              style="width: 120px; margin: 5px;"
            >{{ ner }}</el-button>
          </el-popover>
        </div>
      </div>
      <div style="height: 100%; display: flex; flex-direction: row; padding-left: 10px;">
        <!-- NER -->
        <div style="width: 30%;">
          <el-button style="width: 100px;" @click="uploadNer">无需标注</el-button>
          <div
            style="padding: 5px;"
            v-for="(ner, nereng) in allTupleData[$store.state.dataInfo.currentLocation]['ner']"
            :key="nereng.id"
          >
            <div style="color: black; font-size: 16px;">{{ nereng }}</div>
            <el-button
              v-for="each_ner in ner"
              :key="each_ner.id"
              :class="priorityColorMap[nereng]"
              @click.native="tmpNerString = each_ner"
              @contextmenu.native="deleteNer(nereng, each_ner)"
            >{{ each_ner.split("@")[1] }}</el-button>
          </div>
        </div>
        <!-- 意图 -->
        <div style="width: 30%;">
          <el-cascader
            v-model="classificationValue"
            :options="attributes"
            filterable
            :show-all-levels="false"
            @change="uploadLabel(classificationValue)"
          ></el-cascader>
          <div class="labeled">
            <span
              @click="genTuple(l)"
              @contextmenu.prevent="deleteLabel(l)"
              style="padding: 5px;"
              v-for="l in allTupleData[$store.state.dataInfo.currentLocation].label"
              :key="l.id"
            >{{ l }}</span>
          </div>
        </div>
        <!-- 二元组 -->
        <div class="labeled" style="width: 40%; display: flex; flex-direction: column">
          <el-button style="width: 100px;" @click="uploadTuple('无需标注')">无需标注</el-button>
          <el-button
            style="width: 100px; margin-left: 0px; margin-top: 10px;"
            @click="uploadTuple('三元组')"
          >三元组</el-button>
          <span
            @contextmenu.prevent="deleteTuple(tuple)"
            style="padding: 5px;"
            v-for="tuple in allTupleData[$store.state.dataInfo.currentLocation]['tuple']"
            :key="tuple.id"
          >
            <span v-if="tuple != '无需标注' || tuple != '三元组'">{{ tuple }}</span>
            <span v-else>{{ tuple }}</span>
          </span>
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
            >标签：{{ result.label.join(" ") }}</span>
            <span
              style="min-width: 120px; color: red; display: inline-block;"
            >index：{{ result.index }}</span>
          </li>
          <li style="color: rgb(44, 46, 46);">文本：{{ result.sentence }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */

export default {
  name: "two_tuples",
  data() {
    return {
      // 全部数据
      allTupleData: [
        {
          sentence: "",
          label: "",
          marked: ""
        }
      ],
      classificationValue: "",
      catchWords: "",
      tmpNerString: "",
      start: 0,
      end: 0,

      nerVisible: false,
      extentOffset: "",
      anchorOffset: "",

      url: "",
      priorityColorMap: {
        item: "color-A",
        symptom: "color-B",
        part: "color-C",
        cause: "color-D",
        innercause: "color-E",
        virus: "color-E",
        check: "color-F",
        surgery: "color-G",
        othertreatment: "color-H",
        age: "color-I",
        foodtherapy: "color-I",
        secretion: "color-J",
        doctor: "color-J",
        period: "color-K",
        tool: "color-K",
        timestamp: "color-L",
        None: "color-L",
        sickness: "color-M",
        timeslot: "color-N",
        datetime: "color-O",
        preoperation: "color-P",
        postoperation: "color-Q",
        checkresult: "color-R",
        danger: "color-S",
        physiology: "color-T"
      },
      // 分类标签
      attributes: [],
      // ner标签
      ners: {},
      // 文件搜索
      searchResult: [],
      question: ""
    };
  },

  created() {
    document.oncontextmenu = function(event) {
      event.preventDefault();
    };
    this.url = this.$getUrl();
    this.readConfig();

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
    readConfig() {
      var department = this.$store.state.dataInfo.filename.split("_")[0];
      this.$axios({
        method: "GET",
        url: this.url + "ReadConfig/",
        params: {
          department: department
        }
      })
        .then(res => {
          if (res["data"]["code"] == 200) {
            this.attributes = res["data"]["data"]["config"]["attribute"];
            this.ners = res["data"]["data"]["config"]["ner"];
            console.log("attribute", this.attributes);
          }
        })
        .catch(error =>
          this.$alert("" + error, "接口异常", {
            confirmButtonText: "确定",
            type: "error"
          })
        );
    },

    clickResult(item) {
      this.$store.state.dataInfo.currentLocation = item["index"];
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
          for (let i = 0; i < this.allTupleData.length; i++) {
            if (
              this.$store.state.dataInfo.dataMarkedInfo[i]["marked"] == 'sentence-no-mark'
            ) {
              let tmp = this.allTupleData[i];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            } else {
              continue;
            }
          }
          return;
        }
        // 判断上传的所有数据里面是否有符合搜索条件的句子
        for (let i = 0; i < this.allTupleData.length; i++) {
          if (
            this.allTupleData[i]["sentence"].match(this.question) ||
            this.allTupleData[i]["label"].join("").indexOf(this.question) > -1
          ) {
            let tmp = this.allTupleData[i];
            tmp["index"] = i;
            this.searchResult.push(tmp);
          } else {
            continue;
          }
        }
        // this.searchResult.reverse();
        this.question = "";
        if (this.searchResult.length > 0) {
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

    // 数组去重
    UniqueArray(array) {
      var hash = [];
      for (var i = 0; i < array.length; i++) {
        if (hash.indexOf(array[i]) == -1) {
          hash.push(array[i]);
        }
      }
      return hash;
      // return Array.from(new Set(array));
    },

    uploadLabel(category) {
      // 标注意图标签
      var intent = category[category.length - 1];
      let label = this.earlyUpload(intent);

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label_ = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label_, ner, tuple);
    },

    earlyUpload(category) {
      // 多意图则去掉第一个 [category] 的 []
      // 单意图则 this.fullData[this.index].label = [category];
      // this.fullData[this.$store.state.dataInfo.currentLocation].label = [category];
      // return category

      if (
        this.allTupleData[this.$store.state.dataInfo.currentLocation].label !=
        ""
      ) {
        let tmp = this.allTupleData[this.$store.state.dataInfo.currentLocation]
          .label;
        tmp.push(category);
        category = this.UniqueArray(tmp);

        this.allTupleData[
          this.$store.state.dataInfo.currentLocation
        ].label = category;
        // console.log("上传的标签：" + category);
      } else {
        this.allTupleData[this.$store.state.dataInfo.currentLocation].label = [
          category
        ];
        return [category];
      }
      return category;
    },

    uploadTuple(tag) {
      // 二元组无需标注
      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      this.$set(this.allTupleData[this.$store.state.dataInfo.currentLocation], 'tuple', [tag]);
      // this.allTupleData[this.$store.state.dataInfo.currentLocation].tuple = [
      //   tag
      // ];
      let tuple = tag;
      this.upload(uuid, filename, label, ner, tuple);

      // 标注进度更新
      console.log(this.allTupleData[this.$store.state.dataInfo.currentLocation])
      if (this.allTupleData[this.$store.state.dataInfo.currentLocation].tuple != 0) {
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["marked"] = "sentence-mark";
        this.$store.state.dataInfo["marked"] += 1;
        this.$store.state.dataInfo["unmark"] -= 1;
      }
      this.$store.state.dataInfo.currentLocation += 1;
      // this.$forceUpdate();
    },

    nextTempClear() {
      this.classificationValue = "";
      this.catchWords = "";
      this.tmpNerString = "";
      this.start = 0;
      this.end = 0;
    },

    getSelectWord(scope) {
      // console.log(window.getSelection());
      let selectedText = window.getSelection();
      this.catchWords = selectedText.toString();
      this.anchorOffset = selectedText.anchorOffset;
      this.extentOffset = selectedText.extentOffset;
      this.start =
        this.anchorOffset < this.extentOffset
          ? this.anchorOffset
          : this.extentOffset;
      this.end =
        this.anchorOffset > this.extentOffset
          ? this.anchorOffset
          : this.extentOffset;
      // console.log(this.start, this.end, scope.row.sentence.slice(this.start, this.end))
      if (this.catchWords.length == 0) {
        return;
      }
      this.nerVisible = true;
      // console.log(document.getSelection().toString());
    },

    selectNextPage(e) {
      this.classificationValue = "";
      if (e["deltaY"] > 0) {
        if (
          this.$store.state.dataInfo.currentLocation ==
          this.allTupleData.length - 1
        ) {
          // this.$message({
          //   message: "已经是最后一个了",
          //   type: "error",
          //   duration: 2000
          // });
          return;
        } else {
          this.nextTempClear();
          this.$store.state.dataInfo.currentLocation += 1;
        }
      } else {
        if (this.$store.state.dataInfo.currentLocation == 0) {
          // this.$message({
          //   message: "已经是第一个了",
          //   type: "error",
          //   duration: 2000
          // });
          return;
        }
        this.nextTempClear();
        this.$store.state.dataInfo.currentLocation -= 1;
      }
    },

    annatatorNer(ner) {
      if (this.catchWords.length == 0) {
        return;
      }
      let start = this.start;
      let end = this.end;
      let nerResult = start + "$" + end + "$" + ner + "@" + this.catchWords;
      // 数据处理
      // 缓存NER标注结果
      if (
        ner in
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      ) {
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
          ner
        ].push(nerResult);
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
          ner
        ] = this.UniqueArray(
          this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
            ner
          ]
        );
      } else {
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
          ner
        ] = [];
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
          ner
        ].push(nerResult);
      }

      this.catchWords = "";
      window.getSelection().removeAllRanges();

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner_ = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner_, tuple);
    },

    genTuple(intention) {
      if (this.tmpNerString.length != 0) {
        this.allTupleData[this.$store.state.dataInfo.currentLocation][
          "tuple"
        ].push([this.tmpNerString, intention].join("#"));
        this.allTupleData[this.$store.state.dataInfo.currentLocation][
          "tuple"
        ] = this.UniqueArray(
          this.allTupleData[this.$store.state.dataInfo.currentLocation]["tuple"]
        );
      } else {
        return;
      }
      // 标注进度更新
      if (
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["tuple"].length != 0
      ) {
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["marked"] = "sentence-mark";
        this.$store.state.dataInfo["marked"] += 1;
        this.$store.state.dataInfo["unmark"] -= 1;
      }
      // 更新前端  更新后端
      this.$forceUpdate();

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
    },

    uploadNer() {
      // NER无需标注
      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = "0$0$None@无需标注";
      this.allTupleData[this.$store.state.dataInfo.currentLocation].ner = {
        None: ["0$0$None@None", "0$0$None@无需标注"]
      };
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
    },

    // 删除意图ner联合标注的ner
    deleteNer(nereng, ner) {
      let index = this.allTupleData[this.$store.state.dataInfo.currentLocation][
        "ner"
      ][nereng].indexOf(ner);
      this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
        nereng
      ].splice(index, 1);
      if (
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"][
          nereng
        ].length == 0
      ) {
        delete this.allTupleData[this.$store.state.dataInfo.currentLocation][
          "ner"
        ][nereng];
      }
      this.$forceUpdate();

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner_ = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner_, tuple);
    },

    // 删除意图
    deleteLabel(val) {
      this.classificationValue = '';
      // console.log(val)
      this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.splice(
        this.allTupleData[
          this.$store.state.dataInfo.currentLocation
        ].label.indexOf(val),
        1
      );

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
    },

    // 删除二元组
    deleteTuple(tuple) {
      let index = this.allTupleData[this.$store.state.dataInfo.currentLocation][
        "tuple"
      ].indexOf(tuple);
      this.allTupleData[this.$store.state.dataInfo.currentLocation][
        "tuple"
      ].splice(index, 1);
      // 修改进度
      if (
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["tuple"].length != 0
      ) {
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["marked"] = "sentence-mark";
      } else {
        this.$store.state.dataInfo.dataMarkedInfo[
          this.$store.state.dataInfo.currentLocation
        ]["marked"] = "sentence-no-mark";
        this.$store.state.dataInfo["marked"] -= 1;
        this.$store.state.dataInfo["unmark"] += 1;
        console.log(this.$store.state.dataInfo);
      }
      this.$forceUpdate();

      let uuid = this.allTupleData[this.$store.state.dataInfo.currentLocation]
        .uuid;
      let filename = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].file;
      let label = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].label.join("@#$");
      let ner = Object.values(
        this.allTupleData[this.$store.state.dataInfo.currentLocation]["ner"]
      )
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple_ = this.allTupleData[
        this.$store.state.dataInfo.currentLocation
      ].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple_);
    },

    // classification按钮函数
    upload(uuid, filename, label, ner, tuple) {
      if (
        this.allTupleData[this.$store.state.dataInfo.currentLocation]
          .sentence == ""
      ) {
        this.$message({
          message: "data error",
          type: "error",
          duration: 1500
        });
        return;
      }

      const url = this.url + "mark/";
      var params = new URLSearchParams();
      params.append("uuid", uuid);
      params.append("filename", filename);
      params.append("label", label);
      params.append("ner", ner);
      params.append("tuple", tuple);
      // if (category.length == 0 && typeof category == "object") {
      //   params.append("label", "");
      // } else if (category.length > 0 && typeof category == "object") {
      //   params.append("label", category.join("、"));
      // } else {
      //   params.append("label", category);
      // }
      this.$axios({
        method: "POST",
        url: url,
        data: params
      })
        .then(response => {
          if (response["data"]["code"] == 200) {
            this.$message({
              message: response["data"]["message"],
              type: "success",
              duration: 1000
            });
            // 自动翻页
            // if (category == "无") {
            //   this.index += 1;
            // }
          } else if (response["data"]["code"] == 201) {
            // 添加/更新当前session标注list
            // this.$set(this.marked_process, this.index, category.split("、"));

            this.$message({
              message: response["data"]["message"],
              type: "success",
              duration: 1000
            });
            return;
          } else {
            this.$message({
              message: response["data"]["data"],
              type: "error",
              duration: 1000
            });
            return;
          }
        })
        .catch(error =>
          this.$alert("接口异常", "错误", {
            confirmButtonText: "确定",
            type: "error"
          })
        );
    },

    uploadSuccess(response) {
      console.log(response);
      if (response["code"] == 200) {
        this.$store.state.dataInfo.filename = response["filename"];
        // 获取所有cqa
        this.allTupleData = response["data"];
        var markedCount = 0;
        for (let i = 0; i < this.allTupleData.length; i++) {
          if (this.allTupleData[i]["tuple"] == "") {
            this.allTupleData[i]["marked"] = "sentence-no-mark";
          } else {
            this.allTupleData[i]["marked"] = "sentence-mark";
            markedCount += 1;
          }
          this.allTupleData[i]["id"] = i;
          this.allTupleData[i]["color"] = "";
          // 判断意图
          if (this.allTupleData[i]["label"] == "") {
            this.allTupleData[i]["label"] = [];
          } else {
            this.allTupleData[i]["label"] = this.allTupleData[i]["label"].split(
              "@#$"
            );
          }
          // 判断NER
          if (this.allTupleData[i]["ner"] == "") {
            this.allTupleData[i]["ner"] = { None: ["0$0$None@None"] };
          } else {
            this.allTupleData[i]["ner"] = this.allTupleData[i]["ner"].split(
              "@#$"
            );

            var each_ner = {};
            each_ner["None"] = ["0$0$None@None"];
            for (let each in this.allTupleData[i]["ner"]) {
              console.log("a", this.allTupleData[i]["ner"][each], this.allTupleData[i])
              let entity_name = this.allTupleData[i]["ner"][each]
                .split("$")[2]
                .split("@")[0];
              if (entity_name in each_ner) {
                each_ner[entity_name].push(this.allTupleData[i]["ner"][each]);
              } else {
                each_ner[entity_name] = [];
                each_ner[entity_name].push(this.allTupleData[i]["ner"][each]);
              }
            }
            this.allTupleData[i]["ner"] = each_ner;
          }
          // 判断二元组
          if (this.allTupleData[i]["tuple"] == "") {
            this.allTupleData[i]["tuple"] = [];
          } else {
            this.allTupleData[i]["tuple"] = this.allTupleData[i]["tuple"].split(
              "@#$"
            );
          }
        }

        // 数据/当前文件 基础信息
        this.$store.state.dataInfo.currentLocation = 0;
        this.$store.state.dataInfo.dataNum = this.allTupleData.length;
        this.$store.state.dataInfo.marked = markedCount;
        this.$store.state.dataInfo.unmark =
          this.allTupleData.length - markedCount;
        // 标注信息统计
        console.log(this.allTupleData);
        this.$store.state.dataInfo.dataMarkedInfo = this.allTupleData;
      } else {
        // 文件上传错误的情况
        this.$message({
          message: response["message"],
          type: "error",
          duration: 2000
        });
      }
    }
  }
};
</script>

<style scoped>
.main {
  margin: 0 auto;
  width: 1600px;
  height: 900px;
  display: flex;
  /* flex-direction: row; */
  /* justify-content: center; */
}

.left {
  background-color: white;
  width: 1200px;
  padding-left: 40px;
  padding-right: 20px;
}

.textarea {
  position: relative;
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  border-radius: 5px;
  width: calc(100% - 46px);
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

.labeled {
  display: flex;
  flex-direction: column;
  color: #4799fc;
  font-size: 20px;
  left: 5px;
  bottom: 5px;
  /* flex: bottom; */
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

.right {
  width: 380px;
  border-left: thick solid #b5b5b5;
  border-left-width: 10px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 50px;
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
  height: 770px;
  border: 1px solid rgb(218, 218, 218);
  overflow-y: scroll;
  border-radius: 5px;
}
</style>
