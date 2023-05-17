<template>
  <div class="hid-data" @mouseleave="drawerData=true">
    <el-drawer
      @mouseleave.native="drawerData=false"
      size="440px"
      title="标注信息展示"
      :visible.sync="drawerData"
      :with-header="false"
      direction="ltr"
    >
      <ul class="data-show">
        <li>
          文件名： {{ $store.state.dataInfo.filename }}
          <el-button size="mini" type="danger" @click="chronoBreak">回滚</el-button>
        </li>
        <li>当前位置： {{ $store.state.dataInfo.currentLocation + 1 }}</li>
        <li>已标注： {{ $store.state.dataInfo.marked }}</li>
        <li>未标注： {{ $store.state.dataInfo.unmark }}</li>
        <li>数据量： {{ $store.state.dataInfo.dataNum }}</li>
      </ul>
      <el-divider></el-divider>
      <ul class="data-show">
        <li>近期标注</li>
        <li
          v-for="sentence in $store.state.dataInfo.recentlyBrowsing"
          :key="sentence.id"
        >{{Object.keys(sentence)[0]}}：{{Object.values(sentence)[0]}}</li>
      </ul>
      <el-divider></el-divider>
      <ul class="data-show">
        <li>
          <!-- 块 -->
          <div class="sentence-block">
            <div
              v-for="each in $store.state.dataInfo.dataMarkedInfo.slice((currentPage - 1) * currentSize, currentPage * currentSize)"
              :class="'sentence-small-block ' + each.marked"
              :key="each.id"
              @click="locaSentence(each.id)"
            >{{ each.id + 1 }}</div>
          </div>
          <!--  -->
          <div class="sentence-block-status" v-if="$store.state.dataInfo.filename">
            <div class="sentence-no-mark"></div>
            <div style="width:50px; line-height:17px;">未标注</div>
            <div class="sentence-mark"></div>
            <div style="width:50px; line-height:17px;">已标注</div>
            <div style="width:100px; line-height:17px;">
              <el-button :disabled="currentPage === 1" @click="handlePrevPage">
                <i class="el-icon-arrow-left"></i>
              </el-button>
              <span>{{ currentPage }}/{{Math.ceil($store.state.dataInfo.dataNum / currentSize)}}</span>
              <el-button
                :disabled="currentPage === Math.ceil($store.state.dataInfo.dataNum / currentSize)"
                @click="handleNextPage"
              >
                <i class="el-icon-arrow-right"></i>
              </el-button>
            </div>
          </div>
        </li>
      </ul>
    </el-drawer>
  </div>
</template>

<script>
// eslint-disable-next-line
/* eslint-disable */

export default {
  name: "leftdrawer",

  data() {
    return {
      currentPage: 1,
      currentSize: 100,
      drawerData: false
    };
  },
  methods: {
    chronoBreak() {
      // 文件退回
      var filename = this.$store.state.dataInfo.filename;
      this.url = this.$getUrl();
      if (filename){
        this.$axios({
          method: "GET",
          url: this.url + "chronoBreak/",
          params: {
            filename: this.$store.state.dataInfo.filename
          }
        }).then(res => {
          console.log(res["data"]);
          if (res["data"]["code"] == 200) {
            this.$message({
              message: res["data"]["message"],
              type: "success",
              duration: 1000
            });
            // 重定向到文件管理页
            this.$router.push("/Layout/FileManagement");
          } else {
            this.$message({
              message: res["data"]["message"],
              type: "error",
              duration: 3000
            });
          }
        });
      }else {
        this.$message('什么也没有发生')
      }
    },
    locaSentence(id) {
      this.$store.state.dataInfo.currentLocation = id;
    },
    handlePrevPage() {
      if (this.currentPage === 1) {
        return;
      }
      this.currentPage -= 1;
    },
    handleNextPage() {
      if (
        this.currentPage ===
        this.$store.state.dataInfo.dataNum / this.currentSize
      ) {
        return;
      }
      this.currentPage += 1;
    }
  },
  mounted() {},
  async created() {}
};
</script>

<style scoped>
.sentence-small-block {
  width: 28px;
  height: 18px;
  color: white;
  margin-left: 4px;
  margin-right: 6px;
  margin-top: 10px;
  float: left;
  font-size: 10px;
  text-align: center;
  border-radius: 2px;
  cursor: pointer;
}

.sentence-mark {
  line-height: 18px;
  background-color: green;
}

.sentence-no-mark {
  line-height: 18px;
  background-color: red;
}

.sentence-block {
  width: 382px;
  height: 280px;
}

.sentence-block-status {
  padding-left: 40px;
  margin-top: 4px;
}

.sentence-block-status div {
  display: inline-block;
  width: 28px;
  height: 17px;
  margin-right: 8px;
}

.sentence-block-status .el-button {
  border: 0;
  padding: 0;
  &:hover,
  &:focus {
    background: transparent;
  }
}

.hid-data {
  float: left;
  width: 1px;
  height: 100%;
  /* padding-left: 20px; */
}
.data-show {
  font-size: 16px;
  list-style: none;
  line-height: 40px;
  padding: 0px;
  padding-left: 30px;
  padding-right: 8px;
  /* line-height: 30px; */
  /* background-color: #f5f7fa; */
  color: #6c7070;
}
</style>
