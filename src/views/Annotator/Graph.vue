<template>
  <div class="main">
    <div class="left">
      <!-----------------------          搜索框          ----------------------->
      <div class="banner">
        <el-input
          type="text"
          v-model="question"
          style="width:calc(100% - 250px); margin-right:5px;"
          placeholder
          v-on:keyup.enter.native="questionSearch()"
        ></el-input>
        <el-button style="min-width:110px;" type="primary" @click="questionSearch()">搜索</el-button>
        <el-button type="primary" @click="ner()">自动标注</el-button>
      </div>

      <div class="graph">
        <!-- 对话显示区域 -->
        <div class="show-dialogs">
          <el-table
            :data="allDialogs[$store.state.dataInfo.currentLocation]"
            stripe
            highlight-current-row
            @cell-click="pasteTag"
            height="100%"
          >
            <el-table-column prop="dialog_id" label="对话ID" min-width="10" align="left"></el-table-column>

            <el-table-column prop="role" label="角色" min-width="10" align="left"></el-table-column>

            <el-table-column prop="sentence" label="句子" min-width="40" align="left">
              <template slot-scope="scope">
                <div v-html="scope.row.sentence" @mouseup="getSelectWord(scope)"></div>
                <div v-if="catchWords.length != 0">
                  <el-popover
                    placement="right-start"
                    width="420"
                    trigger="manual"
                    v-model="nerVisible"
                    v-show="scope.row.sentence_id==popoverId ? true:false"
                  >
                    <el-button
                      v-for="(nereng, ner)  in ners"
                      :key="ner.id"
                      @click="graphNer(scope.row, nereng)"
                      style="width: 120px; margin: 5px;"
                    >{{ ner }}</el-button>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!--实体点击区域-->
        <div class="show-entities">
          <div
            v-for="(each_entity, key) in onlineNERS[allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id]"
            :key="each_entity.id"
          >
            <!-- 显示part/item等英文 -->
            <div style="height:30px;">{{ key }}</div>
            <el-popover
              placement="right"
              width="380"
              trigger="click"
              :disabled="status"
              v-for="each in each_entity"
              :key="each.id"
            >
              <div class="relation-buttons">
                <!-- 关系显示/点击 -->
                <el-button
                  slot="reference"
                  style="margin: 5px; width:180px; height:40px;"
                  v-for="btn in relations"
                  :key="btn.id"
                  @click="relationButtonClick(btn)"
                >{{ btn }}</el-button>
              </div>
              <!-- 实体显示/点击 -->
              <el-button
                slot="reference"
                :class="priorityColorMap[key]"
                @contextmenu.native="removeNer(each)"
                @click="entityClick(key, each)"
                style="margin: 5px; width: 200px; padding:10px;"
              >{{ each.split("@")[1] }}</el-button>
            </el-popover>
          </div>
        </div>
        <!-- 实体关系标注结果显示区域 -->
        <div class="show-entities-relation" @mousewheel="selectNextPage">
          <div>
            <div
              style="display:flex; align-items:center; justify-content:  space-between"
              v-if="(allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id in twoRelations && twoRelations[allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id].length > 0)"
            >
              <span>标签数量：{{ twoRelations[allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id].length }}</span>
              <el-button type="danger" size="mini" @click="AllRelationDelete()">一键清除</el-button>
            </div>
            <span v-else>标签数量：0</span>
          </div>

          <ul
            class="entity-relation color-D"
            v-for="tag in ['无需标注', '我也不知道怎么标']"
            :key="tag.id"
            v-if="!(allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id in twoRelations && twoRelations[allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id].length > 0)"
          >
            <li @click="nextDialog(tag)">{{ tag }}</li>
          </ul>
          <ul
            v-for="twoRelation in twoRelations[allDialogs[$store.state.dataInfo.currentLocation][0].dialog_id]"
            :key="twoRelation.id"
            class="entity-relation"
            @contextmenu.prevent="removeRelation(twoRelation)"
          >
            <!-- 改变两个实体的位置 放在上面<ul>里 -->
            <!-- @click="changeEntityLocation(twoRelation)" -->
            <li v-if="twoRelation != '无需标注' && twoRelation != '我也不知道怎么标'">
              <!-- 显示单个关系 -->
              <span v-if="twoRelation.split('#').length == 2">
                <span
                  :class="priorityColorMap[twoRelation.split('@')[0].split('$')[3]]"
                >{{ twoRelation.split('#')[0] }}</span>
                <span>--{{ twoRelation.split('#')[1] }}</span>
              </span>
              <!-- 显示两个关系 -->
              <span v-else-if="twoRelation.split('#').length > 2">
                <span
                  :class="priorityColorMap[twoRelation.split('@')[0].split('$')[3]]"
                >{{ twoRelation.split('#')[0] }}</span>
                <span>--{{ twoRelation.split('#')[1] }}--</span>
                <span
                  :class="priorityColorMap[twoRelation.split('#')[2].split('@')[0].split('$')[3]]"
                >{{ twoRelation.split('#')[2] }}</span>
                <!-- 显示 问关系 和 条件 -->
                <!-- <span>#{{ twoRelation.split('#')[3] }}</span> -->
              </span>
            </li>
            <!-- 无需标注 -->
            <li v-else>
              <span :class="priorityColorMap[twoRelation]">{{ twoRelation }}</span>
            </li>
          </ul>
        </div>
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
          <li>DID：{{ result.dialog_id }}</li>
          <li>角色：{{ result.role }}</li>
          <li>句子：{{ result.sentence }}</li>
          <!-- <li>标注：{{ result.label }}</li> -->
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import axios from 'axios'

export default {
  name: "graph",
  data() {
    return {
      // 位置信息
      index: 0,
      // 全部数据
      allGraphs: [],

      // 临时存放点击的实体
      tmpRelation: [],
      // ner标注拖动的实体
      catchWords: "",
      // 全局的三元组关系
      twoRelations: {},
      twoEntity: [],

      url: "",
      // 数据相关
      allDialogs: [[{ sentence: "", dialog_id: "" }]],
      onlineNERS: { "": "" },
      // 配置文件
      ners: {},
      relations: {},
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
      status: true,
      entitiesClickCount: 0,

      // 文件搜索
      searchResult: [],
      question: ""
    };
  },

  created: function() {
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
    this.currentPage = 1;
  },

  computed: {},

  methods: {
    ner(){
      console.log(this.$store.state.dataInfo.currentLocation)
      let answer='';
      this.$axios({
        method:"GET",
        url:this.url +"predict/",
        params: {
          sentence:this.allDialogs[this.$store.state.dataInfo.currentLocation][0]['sentence']
        },
      }).then(res=>{
        answer = res.data.output;
        answer.forEach(element =>{
          let ner = element.type;
          let nerResult =
            this.$store.state.dataInfo.currentLocation +
            "$" +
            element.start +
            "$" +
            element.end +
            "$" +
            element.type +
            "@" +
            element.span;

          // 判断当前对话是否有 ner 这个实体
          // 没有则创建，有则添加后去重
          if (this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]] == undefined) {
            this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]] = {
              None: ["0$0$0$None@None"]
            };
          }
          if (ner in this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]]) {
            this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner].push(nerResult);
            this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner] = this.UniqueArray(
              this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner]);
          } else {
            this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner] = [];
            this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0][ "dialog_id"]][ner].push(nerResult);
          }
          this.$forceUpdate();
          // 更新整体的实体

          this.graphUpload(nerResult);
          // this.fullData[this.pre]["mark"] = "sentence-mark";

          this.catchWords = "";
          window.getSelection().removeAllRanges();
        })
        console.log(this.onlineNERS)
      })
    },
    graphNer(row, ner) {
      let sentence_id = row.sentence_id;
      let start = this.start;
      let end = this.end;
      let nerResult =
        sentence_id +
        "$" +
        start +
        "$" +
        end +
        "$" +
        ner +
        "@" +
        this.catchWords;

      // 判断当前对话是否有 ner 这个实体
      // 没有则创建，有则添加后去重
      if (this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]] == undefined) {
        this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]] = {
          None: ["0$0$0$None@None"]
        };
      }
      if (ner in this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]]) {
        this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner].push(nerResult);
        this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner] = this.UniqueArray(
          this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner]);
      } else {
        this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0]["dialog_id"]][ner] = [];
        this.onlineNERS[this.allDialogs[this.$store.state.dataInfo.currentLocation][0][ "dialog_id"]][ner].push(nerResult);
      }
      this.$forceUpdate();
      // 更新整体的实体

      this.graphUpload(nerResult);
      // this.fullData[this.pre]["mark"] = "sentence-mark";

      this.catchWords = "";
      window.getSelection().removeAllRanges();
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

      if (this.mclasseng != "intention") {
        this.popoverId = scope.row.sentence_id;
      }
      if (this.catchWords.length == 0) {
        return;
      }
      this.nerVisible = true;
      // console.log(document.getSelection().toString());
    },

    readConfig() {
      var department = this.$store.state.dataInfo.filename.split("_")[0];

      this.$axios({
        method: "GET",
        url: this.url + "ReadConfig/",
        params: {
          department: department
        }
      }).then(res => {
        if (res["data"]["code"] == 200) {
          this.ners = res["data"]["data"]["config"]["ner"];
          this.relations = res["data"]["data"]["config"]["relation"];
        }
      });
    },

    getAnswer(){
      console.log(1)
    },
    selectNextPage(e) {
      if (e["deltaY"] > 0) {
        if (
          this.$store.state.dataInfo.currentLocation ==
          this.allDialogs.length - 1,
          this.getAnswer()
        ) {
          // this.$message({
          //   message: "已经是最后一个了",
          //   type: "error",
          //   duration: 2000
          // });
          return;
        } else {
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
        this.$store.state.dataInfo.currentLocation -= 1;
      }
      this.nextGraph();
    },

    nextGraph() {
      this.deltaY = 0;
      this.twoEntity = [];
      this.catchWords = "";
      this.tmpRelation = [];
      this.entitiesClickCount = 0;
      this.highlight = [];
    },

    up() {
      if (this.$store.state.dataInfo.currentLocation == 0) {
        // this.$message({
        //   message: "已经是第一个了",
        //   type: "error",
        //   duration: 2000
        // });
        return;
      }
      this.$store.state.dataInfo.currentLocation -= 1;
    },

    down() {
      if (
        this.$store.state.dataInfo.currentLocation ==
        this.allIntentions.length - 1
      ) {
        // this.$message({
        //   message: "已经是最后一个了",
        //   type: "error",
        //   duration: 2000
        // });
        return;
      } else {
        this.$store.state.dataInfo.currentLocation += 1;
      }
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
          for (
            let i = 0;
            i < this.$store.state.dataInfo.dataMarkedInfo.length;
            i++
          ) {
            // 句子层面搜索
            if (this.$store.state.dataInfo.dataMarkedInfo[i]["marked"] == "sentence-no-mark") {
              let tmp = this.allDialogs[i][0];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            } else {
              continue;
            }
          }
          return;
        }
        // 判断上传的所有数据里面是否有符合搜索条件的句子
        for (let i = 0; i < this.allDialogs.length; i++) {
          // 句子层面搜索
          let dialog_id = this.allDialogs[i][0]["dialog_id"];
          for (let j = 0; j < this.allDialogs[i].length; j++) {
            if (this.allDialogs[i][j]["sentence"].match(this.question)) {
              let tmp = this.allDialogs[i][j];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            } else {
              // console.log(this.searchResult)
              continue;
            }
          }
          // 标注结果层面搜索
          if (this.twoRelations[dialog_id] != undefined) {
            for (let j = 0; j < this.twoRelations[dialog_id].length; j++) {
              if (this.twoRelations[dialog_id][j].match(this.question)) {
                let tmp = this.allDialogs[i][0];
                tmp["index"] = i;
                this.searchResult.push(tmp);
              } else {
                // console.log(this.searchResult)
                continue;
              }
            }
          } // this.dialogs[i]["sentence"].match(this.question)
        }
        this.searchResult.reverse();
        this.question = "";
        if (this.searchResult.length > 0) {
          console.log(this.searchResult);
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

    pasteTag(row, column, cell, event) {
      this.locCurrentSentenceId(row, column, event);
    },

    locCurrentSentenceId(row, column, event) {
      if (
        column == undefined ||
        ["sentence_id", "role", "sentence"].indexOf(column["label"]) != -1
      ) {
        this.currentDialogId = row.dialog_id;
        this.currentSentenceId = row.sentence_id;
        this.currentRole = row.role;
        return;
      }
      this.currentDialogId = row.dialog_id;
      this.currentSentenceId = row.sentence_id;
      this.currentColumn = column["label"];
      this.currentRole = row.role;
      console.log(
        "当前row：",
        this.currentDialogId,
        this.currentSentenceId,
        this.currentColumn,
        this.currentRole
      );
    },

    uploadSuccess(response) {
      if (response["code"] == 200) {
        this.$store.state.dataInfo.filename = response["filename"];
        this.allGraphs = response["data"];
        // 标注的三元组
        this.twoRelations = response["category"][0];
        // 标注的NER
        this.onlineNERS = response["category"][1];
        console.log("two relations：", this.twoRelations);

        // 转化对话 / 单句的格式
        var dialog_id = this.allGraphs[0]["dialog_id"];
        // 每一个dialog 是一个临时变量
        var eachDialog = [];
        var dialogs = [];
        if (this.allGraphs[0]["dialog_id"] == this.allGraphs[1]["dialog_id"]) {
          for (
            var graphIndex = 0;
            graphIndex < this.allGraphs.length;
            graphIndex++
          ) {
            if (this.allGraphs[graphIndex]["dialog_id"] == dialog_id) {
              eachDialog.push(this.allGraphs[graphIndex]);
            } else {
              if (eachDialog.length == 1) {
                dialogs.push(eachDialog);
                eachDialog = [];
                eachDialog.push(this.allGraphs[graphIndex]);
              }
              dialogs.push(eachDialog);
              eachDialog = [];
              dialog_id = this.allGraphs[graphIndex + 1]["dialog_id"];
              eachDialog.push(this.allGraphs[graphIndex]);
            }
          }
          dialogs.push(eachDialog);
        } else {
          for (
            var graphIndex = 0;
            graphIndex < this.allGraphs.length;
            graphIndex++
          ) {
            dialogs.push([this.allGraphs[graphIndex]]);
          }
        }

        // 切分好的对话 / 单句
        this.allDialogs = dialogs;
        // 初始化显示在页面上的第一个对话 / 单句
        // this.flipGraph = dialogs[0];

        // 处理已经标注的NER标签
        let result = {};
        for (let each in this.onlineNERS) {
          let each_ner = {};
          for (let tmp_ner in this.onlineNERS[each]) {
            let entity_name = this.onlineNERS[each][tmp_ner]
              .split("$")[3]
              .split("@")[0];
            if (entity_name in each_ner) {
              each_ner[entity_name].push(this.onlineNERS[each][tmp_ner]);
            } else {
              each_ner[entity_name] = [];
              each_ner[entity_name].push(this.onlineNERS[each][tmp_ner]);
            }
          }
          // 添加None关系
          each_ner["None"] = ["0$0$0$None@None"];
          result[each] = each_ner;
        }
        this.onlineNERS = result;
        console.log("onlineners", this.onlineNERS);

        // 数据/当前文件 基础信息
        this.$store.state.dataInfo.currentLocation = 0;
        this.$store.state.dataInfo.dataNum = this.allGraphs.length;
        var markedCount = 0;
        for (var each in response["content"]) {
          if (response["content"][each]["marked"] == "sentence-mark") {
            markedCount += 1;
          }
        }
        this.$store.state.dataInfo.marked = markedCount;
        this.$store.state.dataInfo.unmark = this.allGraphs.length - markedCount;
        // 标注信息统计
        this.$store.state.dataInfo.dataMarkedInfo = response["content"];
      } else {
        // 文件上传错误的情况
        this.$message({
          message: response["message"],
          type: "error",
          duration: 2000
        });
      }
    },

    nextDialog(tag) {
      this.$store.state.dataInfo.dataMarkedInfo[
        this.$store.state.dataInfo.currentLocation
      ]["marked"] = "sentence-mark";
      this.graphUpload(tag);
      this.twoRelations[
        this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
          "dialog_id"
        ]
      ] = [];
      this.twoRelations[
        this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
          "dialog_id"
        ]
      ].push(tag);
      // console.log(this.fullData[this.pre]);
      this.$store.state.dataInfo.marked += 1;
      this.$store.state.dataInfo.unmark -= 1;
      this.$store.state.dataInfo.currentLocation += 1;
      this.$forceUpdate();
      this.nextGraph();
    },

    entityClick(key, entity) {
      // 实体点击事件
      this.entitiesClickCount += 1;
      this.twoEntity.push([entity].join("@"));
      if (this.twoEntity.length > 2) {
        // 点了多次清空数组
        this.twoEntity.splice(0, 1);
        // this.twoEntity.push([entity].join("@"));
        this.entitiesClickCount = 1;
      } else if (this.entitiesClickCount == 2) {
        this.entitiesClickCount = 0;
        this.status = false;
        // 点击两个实体后自动标注
        // if (this.twoEntity.length >= 2) {
        //   // 找到最后一个实体
        //   let lastentityName = this.twoEntity[this.twoEntity.length - 1].split(
        //     "$"
        //   )[3].split("@")[0];
        //   let entityName = this.twoEntity[this.twoEntity.length - 2].split(
        //     "$"
        //   )[3].split("@")[0];
        //   // 找到关系映射
        //   // console.log(this.twoEntity[this.twoEntity.length - 1])
        //   let relation = this.relationMap[lastentityName];
        //   if (lastentityName == entityName || lastentityName == "foodtherapy") {
        //     // console.log("relation", relation)
        //     this.status = false;
        //   } else {
        //     this.relationButtonClick(relation);
        //   }
        // }
      }
      console.log(this.entitiesClickCount, this.status, this.twoEntity);
    },

    findEntityLocation(relation) {
      for (
        var i = 0;
        i <
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ].length;
        i++
      ) {
        if (
          relation ==
          this.twoRelations[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ][i]
        ) {
          return i;
        }
      }
      return -1;
    },

    relationButtonClick(relation) {
      // 关系点击事件
      var twoEntityLength = this.twoEntity.length;
      // console.log(this.tmpRelation, this.twoEntity, relation);
      if (
        this.twoEntity[twoEntityLength - 2] ==
          this.twoEntity[twoEntityLength - 1] &&
        this.twoEntity[twoEntityLength - 1] != "0$0$0$None@None"
      ) {
        // 如果是单句标注，则取最后一个标签
        this.tmpRelation = [this.twoEntity[twoEntityLength - 1], relation];
      } else if (this.twoEntity.length == 0) {
        console.log("this.twoEntity.length == 0");
        this.$message({
          message: "this.twoEntity.length == 0",
          type: "error",
          duration: 1000
        });
      } else {
        // 如果不是单句标注，则取最后两个标签
        this.tmpRelation = [
          this.twoEntity[twoEntityLength - 2],
          relation,
          this.twoEntity[twoEntityLength - 1]
        ];
      }
      //   console.log("a", this.tmpRelation);
      //   if (this.tmpRelation.length == 3 && this.relation != "") {
      //     this.tmpRelation.push(this.relation);
      //   }

      // 如果那一段没标过
      if (
        !(
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ] in this.twoRelations
        )
      ) {
        // 创建一个空的[]
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ] = [];
      }
      if (
        // 如果标签之前就存在了，则关闭关系标注窗口
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ].indexOf(this.tmpRelation) >= 0
      ) {
        this.status = true;
        this.twoEntity = [];
        this.entitiesClickCount = 0;
        this.$message({
          message: "该关系已存在",
          type: "error",
          duration: 1000
        });
        return;
      }

      // 上面都是判断是否要添加标签
      // 如果需要 条件/问关系 则：this.tmpRelation.length == 4
      if (this.tmpRelation.length == 3) {
        this.tmpRelation = this.tmpRelation.join("#");
        var len = this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ].length;
        this.$set(
          this.twoRelations[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ],
          len,
          this.tmpRelation
        );
        this.$forceUpdate();
        this.twoEntity = [];
        this.graphUpload(this.tmpRelation);
        this.tmpRelation = [];
        if (
          this.twoRelations[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ].length == 1
        ) {
          this.$store.state.dataInfo.dataMarkedInfo[
            this.$store.state.dataInfo.currentLocation
          ]["marked"] = "sentence-mark";
          this.$store.state.dataInfo.marked += 1;
          this.$store.state.dataInfo.unmark -= 1;
        }
        this.entitiesClickCount = 0;
        this.status = true;
      }
    },

    changeEntityLocation(relation) {
      // 鼠标左键单击改变实体的左右位置
      // let idx = this.findEntityLocation(relation);
      let idx = this.twoRelations[
        this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
          "dialog_id"
        ]
      ].indexOf(relation);
      this.$set(
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0]
            .dialog_id
        ],
        idx,
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ][idx]
          .split("#")
          .reverse()
          .join("#")
      );
      this.$forceUpdate();
      this.graphUpload(
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ][idx]
      );
    },

    judgeLabelIsEmpty() {
      // 关系标注的数量
      let relationNum =
        this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ] == undefined
          ? 0
          : this.twoRelations[
              this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
                "dialog_id"
              ]
            ].length;
      //   let nerNum = 0;
      //   let values =
      //     this.onlineNERS[
      //       this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
      //         "dialog_id"
      //       ]
      //     ] == undefined
      //       ? 0
      //       : Object.values(
      //           this.onlineNERS[
      //             this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
      //               "dialog_id"
      //             ]
      //           ]
      //         );

      //   for (let value in values) {
      //     nerNum += value.length;
      //   }
      // && nerNum == 0
      if (relationNum == 0) {
        return false;
      } else {
        return true;
      }
    },

    removeNer(ner) {
      this.$confirm("此操作将永久删除该标签", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        let entity_name = ner.split("$")[3].split("@")[0];
        let idx = this.onlineNERS[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ][entity_name].indexOf(ner);
        let deletedNer = this.onlineNERS[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ][entity_name].splice(idx, 1);

        console.log("删除NER", deletedNer);
        // 判断是否未空字典
        if (
          this.onlineNERS[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ][entity_name].length == 0
        ) {
          delete this.onlineNERS[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ][entity_name];
        }
        // 发送删除请求
        const url = this.url + "mark/";
        var params = new URLSearchParams();
        this.graphUpload(ner, "delete");

        console.log(
          this.onlineNERS[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ]
        );
        this.$forceUpdate();
      });
    },

    removeRelation(relation) {
      // 删除实体关系
      this.$confirm("此操作将永久删除该标签", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        let idx = this.findEntityLocation(relation);
        // console.log(idx, this.twoRelations);
        let deletedRelation = this.twoRelations[
          this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
            "dialog_id"
          ]
        ].splice(idx, 1);
        console.log("删除关系", deletedRelation);
        // 发送删除请求
        const url = this.url + "mark/";
        var params = new URLSearchParams();
        this.graphUpload(relation, "delete");

        if (this.judgeLabelIsEmpty() == false) {
          this.$store.state.dataInfo.dataMarkedInfo[
            this.$store.state.dataInfo.currentLocation
          ]["marked"] = "sentence-no-mark";
          this.$store.state.dataInfo.marked -= 1;
          this.$store.state.dataInfo.unmark += 1;
        }
        this.$forceUpdate();
      });
    },

    AllRelationDelete() {
      // 删除实体关系
      this.$confirm("此操作将永久删除该对话下所有标签", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        var dialog_id = this.allDialogs[
          this.$store.state.dataInfo.currentLocation
        ][0]["dialog_id"];
        var filename = this.$store.state.dataInfo.filename;

        console.log(
          "删除所有标签",
          this.twoRelations[
            this.allDialogs[this.$store.state.dataInfo.currentLocation][0][
              "dialog_id"
            ]
          ]
        );
        this.twoRelations[dialog_id] = [];
        // 发送删除请求
        this.$axios({
          method: "GET",
          url: this.url + "AllRelationDelete/",
          params: {
            dialog_id: dialog_id,
            filename: filename
          }
        })
          .then(res => {
            // console.log(res["data"]["data"]);
            if (res["data"]["code"] == 200) {
              this.$message({
                type: "success",
                message: "删除成功"
              });
              // console.log(this.judgeLabelIsEmpty() == false);
              if (this.judgeLabelIsEmpty() == false) {
                this.$store.state.dataInfo.dataMarkedInfo[
                  this.$store.state.dataInfo.currentLocation
                ]["marked"] = "sentence-no-mark";
                this.$store.state.dataInfo.marked -= 1;
                this.$store.state.dataInfo.unmark += 1;
              }
              this.$forceUpdate();
            }
          })
          .catch(error =>
            this.$alert("" + error, "接口异常", {
              confirmButtonText: "确定",
              type: "error"
            })
          );
      });
    },

    graphUpload(relation, del) {
      const url = this.url + "mark/";
      var params = new URLSearchParams();

      // file dialog_id label
      params.append("filename", this.$store.state.dataInfo.filename);
      params.append(
        "dialog_id",
        this.allDialogs[this.$store.state.dataInfo.currentLocation][0].dialog_id
      );
      params.append("entity_value_relationship", relation);
      params.append("early_entity_value_relationship", "");
      params.append("delete", del);

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
          } else if (response["data"]["code"] == 201) {
            this.$message({
              message: response["data"]["message"],
              type: "success",
              duration: 1000
            });
            return;
          } else {
            this.$message({
              message: response["data"]["message"],
              type: "error",
              duration: 1000
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
    },

    // 数组去重
    UniqueArray(array) {
      return Array.from(new Set(array));
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.banner {
  width: 100%;
  margin: 0 auto;
  margin-bottom: 10px;
}

.graph {
  height: calc(100% - 126px);
  position: relative;
  border-radius: 5px;
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  min-height: 120px;
  display: flex;
  margin: 0 auto;
}

.graph .show-dialogs {
  width: 48%;
}

.graph .show-entities {
  width: 422px;
  margin: 5px;
}

.graph .show-entities-relation {
  width: 320px;
  margin: 5px;
  overflow-y: scroll;
}

.search-result {
  height: 776px;
  width: 380px;
  border: 1px solid rgb(218, 218, 218);
  overflow-y: scroll;
  border-radius: 5px;
}

.left {
  background-color: white;
  width: 1480px;
  padding-left: 40px;
  padding-right: 20px;
}

.right {
  width: 380px;
  border-left: thick solid #b5b5b5;
  border-left-width: 10px;
  padding-left: 20px;
  padding-right: 20px;
  /* padding-top: 10px; */
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

.qagroup {
  list-style: none;
  padding: 0px;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 8px;
  padding-bottom: 8px;
  /* line-height: 30px; */
  font-size: 18px;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #a9abaf;
  border-radius: 5px;
}
.entity-relation {
  font-size: 16px;
  list-style: none;
  padding: 0px;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 8px;
  padding-bottom: 8px;
  /* line-height: 30px; */
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #6c7070;
  border-radius: 5px;
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
</style>

<style>
</style>
