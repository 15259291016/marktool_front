<template>
  <div class="main">
    <div class="left">
      <!-- display:flex; flex-wrap: wrap; -->
      <div style="width:98%;padding-right:10px; padding-bottom:10px;">
        <!-- 选取文件 & 上传到服务器 -->
        <el-upload
          style="display:inline-block;"
          class="upload"
          ref="upload"
          :action="uploadurl"
          :on-change="getFileName"
          :on-success="uploadSuccess"
          :limit="1"
          :auto-upload="false"
          :disabled="user.permission>1? false: true"
        >
          <el-button slot="trigger" type="primary">选取文件</el-button>
          <el-button style="margin-left: 10px;" @click="submitUpload">上传到服务器</el-button>
        </el-upload>
        <!-- 选择标注类型 -->
        <el-select
          v-model="mclass"
          @change="reqUnMarkFiles"
          filterable
          placeholder="请选择"
          style="width:100px;"
        >
          <el-option
            v-for="mclass in markClass"
            :key="mclass.value"
            :label="mclass.label"
            :value="mclass.value"
            :disabled="mclass.disabled"
          ></el-option>
        </el-select>
        <!-- 远端文件选择 -->
        <el-select
          v-model="filename"
          :filterable="user.permission>0? true:false"
          remote
          :remote-method="remoteMethod"
          @change="choseFile"
          placeholder="远端文件选择"
        >
          <el-option
            v-for="file in unMarkFiles"
            :key="file.value"
            :label="file.label"
            :value="file.value"
          ></el-option>
        </el-select>
        <el-select
          v-model="filename"
          :filterable="user.permission>0? true:false"
          @change="choseFile"
          placeholder="未认领文件"
        >
          <el-option
            v-for="file in unNameFiles"
            :key="file.value"
            :label="file.label"
            :value="file.value"
          ></el-option>
        </el-select>
        <div style="color: #858585; display: inline-block;">
          <span v-if="mclasseng=='graph'          && pre   >= 0">当前位置：{{pre + 1}}</span>
          <span v-else-if="mclasseng=='intention' && index >= 0">当前位置：{{index + 1}}</span>
          <span v-else-if="mclasseng=='cqa'       && pre   >= 0">当前位置：{{pre + 1}}</span>
        </div>

        <el-button
          type="danger"
          style="float: right;"
          v-if="user.zh_name=='质检' && mclasseng=='graph'"
          @click="check(), dialogTableVisible=true"
        >质检</el-button>
        <el-dialog
          title="质检结果"
          :visible.sync="dialogTableVisible"
          :lock-scroll="false"
          @close="checkData=[]"
        >
          <span v-for="each in title.split(',')" :key="each.id" style="font-size:16px">
            <p>{{ each }}</p>
          </span>
          <h2>不相同的实体</h2>
          <el-table :data="checkData[0]" style="overflow: auto;">
            <el-table-column property="outer" label="标注" width="500"></el-table-column>
            <el-table-column property="inner" label="质检" width="500"></el-table-column>
          </el-table>
          <h2>相同的实体</h2>
          <el-table :data="checkData[1]" style="overflow: auto;">
            <el-table-column property="same" label="相同实体" width="500"></el-table-column>
          </el-table>
        </el-dialog>
      </div>

      <!-- top -->
      <div style="width:98%;">
        <!-----------------------          搜索框          ----------------------->
        <div style="width:100%; display:flex; padding-left:10px;">
          <el-input
            type="text"
            v-model="question"
            style="width:calc(100% - 115px); margin-right:5px;"
            placeholder
            v-on:keyup.enter.native="questionSearch()"
          ></el-input>
          <el-button style="min-width:100px;" type="primary" @click="questionSearch()">搜索</el-button>
        </div>
      </div>
      <!-----------------------          文本显示区          ----------------------->
      <div
        class="textarea"
        v-if="fullData.length > 0 && (mclasseng == 'intention' || mclasseng == 'action')"
        @mousewheel="selectClsPage"
      >
        <!-- @mouseup="getSelectWord()" -->
        <div class="text" v-html="fullData[index].sentence" ></div>
        <div class="labeled" :v-model="fullData[index].label">
          <!-- {{ marked_process[index] }}&emsp;&emsp; -->
          <span
            @contextmenu.prevent="deleteLabel(l)"
            style="padding-left:5px; padding-right:5px;"
            v-for="l in fullData[index].label"
            :key="l.id"
          >{{l}}</span>
        </div>
        <!-- <div v-if="catchWords.length != 0">
          <el-popover placement="right-start" width="420" trigger="manual" v-model="nerVisible">
            <el-button
              v-for="(nereng, ner)  in ners"
              :key="ner.id"
              @click="intentionNer(nereng)"
              style="width: 120px; margin: 5px;"
            >{{ ner }}</el-button>
          </el-popover>
        </div> -->
      </div>

      <!-- 知识图谱 -->
      <div v-if="mclasseng == 'graph'" class="graph">
        <!-- 对话显示区域 -->
        <div class="show-dialogs">
          <el-table
            :data="flipGraph"
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
        <!-- 实体点击区域 -->
        <div class="show-entities">
          <div
            v-for="(each_entity, key) in onlineNERS[flipGraph[0].dialog_id]"
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
              <div class="relation-buttons" v-if="filename.indexOf('单句') == -1">
                <!-- 关系显示/点击 -->
                <el-button
                  slot="reference"
                  style="margin: 5px; width:180px; height:40px;"
                  v-for="btn in relationButtons"
                  :key="btn.id"
                  @click="relationButtonClick(btn)"
                >{{ btn }}</el-button>
              </div>
              <div class="relation-buttons" v-else>
                <!-- 关系显示/点击 单句 -->
                <el-button
                  slot="reference"
                  :class="btn=='条件' || btn=='问关系' ? 'color-D': '_'"
                  style="margin: 5px; width:180px; height:40px;"
                  v-for="btn in singlerelationButtons"
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
        <div class="show-entities-relation" @mousewheel="selectGraphPage">
          <div>
            <div
              style="display:flex; align-items:center; justify-content:  space-between"
              v-if="(flipGraph[0].dialog_id in twoRelations && twoRelations[flipGraph[0].dialog_id].length > 0)"
            >
              <span>标签数量：{{ twoRelations[flipGraph[0].dialog_id].length }}</span>
              <el-button type="danger" size="mini" @click="AllRelationDelete()">一键清除</el-button>
            </div>
            <span v-else>标签数量：0</span>
          </div>

          <ul
            class="entity-relation color-D"
            v-for="tag in ['无需标注', '我也不知道怎么标']"
            :key="tag.id"
            v-if="!(flipGraph[0].dialog_id in twoRelations && twoRelations[flipGraph[0].dialog_id].length > 0)"
          >
            <li @click="nextDialog(tag)">{{ tag }}</li>
          </ul>
          <ul
            v-for="twoRelation in twoRelations[flipGraph[0].dialog_id]"
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
      <!-- 会话标注 -->
      <div v-if="mclasseng == 'session'" class="session">
        <div style="padding-left: 10px; height:60px; display:flex; align-items: center;">
          <el-checkbox-group v-model="checkList" @change="hiddenSomething">
            <el-checkbox-button label="sentence_id"></el-checkbox-button>
            <el-checkbox-button label="role"></el-checkbox-button>
            <!-- <el-checkbox label="句子"></el-checkbox> -->
            <el-checkbox-button label="entity"></el-checkbox-button>
            <el-checkbox-button label="global_topic"></el-checkbox-button>
            <el-checkbox-button label="local_topic"></el-checkbox-button>
            <el-checkbox-button label="confirm_entity"></el-checkbox-button>
            <el-checkbox-button label="unconfirm_entity"></el-checkbox-button>
            <el-checkbox-button label="intention"></el-checkbox-button>
            <el-checkbox-button label="action"></el-checkbox-button>
            <el-checkbox-button label="qa"></el-checkbox-button>
          </el-checkbox-group>
          <el-button-group style="margin-left: 10px;">
            <el-button
              type="primary"
              style="height: 38px;"
              icon="el-icon-arrow-left"
              @click="selectSesPage('上一页')"
            >上一页</el-button>
            <el-button type="primary" style="height: 38px;" @click="selectSesPage('下一页')">
              下一页
              <i class="el-icon-arrow-right el-icon--right"></i>
            </el-button>
          </el-button-group>
        </div>
        <div
          class="show-dialogs"
          @keyup.up="selectSesPage('上一页')"
          @keyup.down="selectSesPage('上一页')"
        >
          <el-table
            :data="flipSession"
            style="width: 100%;"
            height="800"
            stripe
            highlight-current-row
            @cell-click="pasteTag"
          >
            <el-table-column
              prop="sentence_id"
              label="sentence_id"
              width="70"
              align="left"
              v-if="checkListTF['sentence_id']"
            ></el-table-column>

            <!-- 角色 -->
            <el-table-column
              prop="role"
              label="role"
              width="80"
              align="left"
              v-if="checkListTF['role']"
            ></el-table-column>

            <!-- 句子 -->
            <el-table-column prop="sentence" label="sentence" max-width="400" align="left">
              <template slot-scope="scope">
                <div v-html="scope.row.sentence" @mouseup="getSelectWord(scope)"></div>
                <div v-if="currentColumn=='entity' && catchWords.length != 0">
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
                      @click="annotatorNer(scope.row.sentence_id, ner), annotatorRow(scope.row)"
                      style="width: 120px; margin: 5px;"
                    >{{ ner }}</el-button>
                  </el-popover>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="entity" width="200" v-if="checkListTF['entity']">
              <template slot-scope="scope">
                <el-tag
                  v-for="tag in scope.row.entity"
                  :key="tag.id"
                  closable
                  type="success"
                  class="col-tag"
                  @click="tagMove(tag)"
                  @dblclick.native="tagReverse(tag, scope.row)"
                  @contextmenu.native="deleteTag(scope.row, 'entity', tag)"
                  @close="deleteTag(scope.row, 'entity', tag)"
                >{{ tag.split("@")[0] }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="local_topic" width="140" v-if="checkListTF['local_topic']">
              <template slot-scope="scope">
                <el-input
                  class="input-new-tag"
                  v-if="currentColumn == 'local_topic' && tagVisible && currentSentenceId==scope.row.sentence_id ? true:false"
                  v-model="tagValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleTagConfirm(scope, 'local_topic')"
                  @blur="handleTagConfirm(scope, 'local_topic')"
                ></el-input>
                <el-button
                  v-else-if="currentColumn == 'local_topic' && currentSentenceId==scope.row.sentence_id ? true:false"
                  class="button-new-tag"
                  size="small"
                  @click="showInput"
                >+ New local_topic</el-button>

                <el-tag
                  v-for="tag in scope.row.local_topic"
                  :key="tag.id"
                  closable
                  type="info"
                  class="col-tag"
                  @click="tagMove(tag)"
                  @contextmenu.native="deleteTag(scope.row, 'local_topic', tag)"
                  @close="deleteTag(scope.row, 'local_topic', tag)"
                >{{ tag.split("@")[0] }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="global_topic" width="140" v-if="checkListTF['global_topic']">
              <template slot-scope="scope">
                <el-input
                  class="input-new-tag"
                  v-if="currentColumn == 'global_topic' && tagVisible && currentSentenceId==scope.row.sentence_id ? true:false"
                  v-model="tagValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleTagConfirm(scope, 'global_topic')"
                  @blur="handleTagConfirm(scope, 'global_topic')"
                ></el-input>
                <el-button
                  v-else-if="currentColumn == 'global_topic' && currentSentenceId==scope.row.sentence_id ? true:false"
                  class="button-new-tag"
                  size="small"
                  @click="showInput"
                >+ New global_topic</el-button>

                <el-tag
                  v-for="tag in scope.row.global_topic"
                  :key="tag.id"
                  closable
                  type="info"
                  class="col-tag"
                  @click="tagMove(tag)"
                  @contextmenu.native="deleteTag(scope.row, 'global_topic', tag)"
                  @close="deleteTag(scope.row, 'global_topic', tag)"
                >{{ tag.split("@")[0] }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="confirm_entity"
              width="140"
              v-if="checkListTF['confirm_entity']"
            >
              <template slot-scope="scope">
                <el-tag
                  v-for="tag in scope.row.confirm_entity"
                  :key="tag.id"
                  closable
                  type="info"
                  class="col-tag"
                  @click="tagMove(tag)"
                  @contextmenu.native="deleteTag(scope.row, 'confirm_entity', tag)"
                  @close="deleteTag(scope.row, 'confirm_entity', tag)"
                >{{ tag.split("@")[0] }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="unconfirm_entity"
              width="140"
              v-if="checkListTF['unconfirm_entity']"
            >
              <template slot-scope="scope">
                <el-tag
                  v-for="tag in scope.row.unconfirm_entity"
                  :key="tag.id"
                  closable
                  type="info"
                  class="col-tag"
                  @click="tagMove(tag)"
                  @contextmenu.native="deleteTag(scope.row, 'unconfirm_entity', tag)"
                  @close="deleteTag(scope.row, 'unconfirm_entity', tag)"
                >{{ tag.split("@")[0] }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="intention" width="160" v-if="checkListTF['intention']">
              <template slot-scope="scope">
                <el-tooltip
                  :content="intent"
                  placement="top"
                  effect="light"
                  :enterable="false"
                  v-for="intent in scope.row.intention"
                  :key="intent.id"
                >
                  <el-tag
                    closable
                    style="margin: 2px;"
                    type="info"
                    class="col-tag"
                    @contextmenu.native="deleteTag(scope.row, 'intention', intent)"
                    @close="deleteTag(scope.row, 'intention', intent)"
                  >{{ intent }}</el-tag>
                </el-tooltip>

                <el-cascader
                  v-if="currentColumn == 'intention' && currentRole == 'CLIENT' && currentSentenceId==scope.row.sentence_id ? true:false"
                  v-model="classificationValue"
                  :options="intents"
                  filterable
                  :show-all-levels="false"
                  @change="annotatorClassification(scope, 'intention', classificationValue), annotatorRow(scope.row)"
                ></el-cascader>
              </template>
            </el-table-column>

            <el-table-column label="action" width="160" v-if="checkListTF['action']">
              <template slot-scope="scope">
                <el-cascader
                  v-if="currentColumn == 'action' && currentRole == 'SERVER' && currentSentenceId==scope.row.sentence_id ? true:false"
                  v-model="classificationValue"
                  :options="actions"
                  filterable
                  :show-all-levels="false"
                  @change="annotatorClassification(scope, 'action', classificationValue), annotatorRow(scope.row)"
                ></el-cascader>
                <el-tooltip
                  :content="action"
                  placement="top"
                  effect="light"
                  :enterable="false"
                  v-for="action in scope.row.action"
                  :key="action.id"
                >
                  <el-tag
                    closable
                    type="info"
                    class="col-tag"
                    @contextmenu.native="deleteTag(scope.row, 'action', action)"
                    @close="deleteTag(scope.row, 'action', action)"
                  >{{ action }}</el-tag>
                </el-tooltip>
              </template>
            </el-table-column>

            <!-- qa -->
            <el-table-column label="qa" width="80" v-if="checkListTF['qa']">
              <template slot-scope="scope">
                <el-input type="text" v-model="scope.row.qa"></el-input>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <!-- cqa -->
      <div
        class="cqa"
        v-else-if="fullData.length > 0 && mclasseng == 'cqa'"
        @mousewheel="selectCqaPage"
      >
        <el-scrollbar>
          <div
            v-for="cqa in flipCqa"
            :key="cqa.uuid"
            style="margin-bottom: 40px; border:1px solid #D5D5D5;"
          >
            <el-input v-model="cqa.context" type="textarea" autosize placeholder="多个Context用空格隔开"></el-input>
            <el-input v-model="cqa.question" type="textarea" autosize disabled></el-input>
            <el-input v-model="cqa.answer" type="textarea" autosize></el-input>
            <div v-if="mclasseng == 'cqa'">
              <el-button
                style="margin-right:10px; font-size:16px; font-weight: 600;"
                v-for="label in cqaLabels"
                :class="label == cqa.label ? colorMap[label]: ''"
                :key="label.id"
                :value="label"
                @click="cqaLabelUpdate(cqa, label)"
              >
                {{ label }}
                <!-- <el-progress type="circle" status="text"></el-progress> -->
              </el-button>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-----------------------          标注按钮区          ----------------------->
      <!-- classification -->
      <!--  display: flex; -->
      <div
        style="width: 100%; height: 100%;"
        v-if="fullData.length > 0 && (mclasseng == 'intention' || mclasseng == 'action')"
        @mousewheel="selectClsPage"
      >
        <div v-for="(each, index) in labelCategories" :key="each.id" style="display:flex; flex-wrap: wrap;">
          <el-button
            v-for="text in each['children']"
            :key="text.id"
            slot="reference"
            :class="'color-' + String.fromCharCode(index + 65)"
            style="margin-right: 10px; margin-top: 10px; width: 140px;font-size: 16px;"
            @mouseenter.native="label_describe(text.value)"
            @click="uploadLabel(text.value)"
          >{{ text.value }}</el-button>
        </div>
        <!-- NER -->
        <!-- <div style="width: 30%;">
          <el-button style="width: 100px;" @click="uploadNer">无需标注</el-button>
          <div
            style="padding: 5px;"
            v-for="(ner, nereng) in fullData[index]['ner']"
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
        </div> -->
        <!-- 意图 -->
        <!-- <div style="width: 30%;">
          <el-cascader
            v-model="classificationValue"
            :options="labelCategories"
            filterable
            :show-all-levels="false"
            @change="uploadLabel(classificationValue)"
          ></el-cascader>
          <div class="labeled">
            <span
              @click="genTuple(l)"
              @contextmenu.prevent="deleteLabel(l)"
              style="padding: 5px;"
              v-for="l in fullData[index].label"
              :key="l.id"
            >{{ l }}</span>
          </div>
        </div> -->
        <!-- 二元组 -->
        <!-- <div class="labeled" style="width: 40%; display: flex; flex-direction: column">
          <el-button style="width: 100px;" @click="uploadTuple">无需标注</el-button>
          <span
            @contextmenu.prevent="deleteTuple(tuple)"
            style="padding: 5px;"
            v-for="tuple in fullData[index]['tuple']"
            :key="tuple.id"
          >
            <span v-if="tuple != '无需标注'">{{ tuple.split("#")[0] + "#" + tuple.split("$")[2] }}</span>
            <span v-else>{{ tuple }}</span>
          </span>
        </div> -->
      </div>
    </div>

    <!-----------------------          右侧          ----------------------->
    <div class="right">
      <div style="display:flex; margin-top: 5px;">
        <template>
          <el-popover placement="top-start" width="400" trigger="hover">
            <!-- 进度 -->
            <div class="sentence-block">
              <div
                v-for="each in this.fullData.slice((currentPage - 1) * currentSize, currentPage * currentSize)"
                :class="'sentence-small-block ' + each.mark"
                :key="each.id"
                @click="locaSentence(each.id)"
              >{{ each.id + 1 }}</div>
            </div>
            <!-- 进度统计选择 -->
            <div v-if="mclasseng == 'intention'">
              <el-checkbox-group v-model="intentionDataStatus" @change="intentionDataStatusChange" :min="1">
                <el-checkbox label="NER" disabled></el-checkbox>
                <el-checkbox label="意图"></el-checkbox>
                <el-checkbox label="二元组" disabled></el-checkbox>
              </el-checkbox-group>
            </div>
            <!-- 提示块 -->
            <div class="sentence-block-status">
              <div class="sentence-no-mark" style="width:30px; line-height:17px;"></div>
              <div style="width:50px; line-height:17px;">未标注</div>
              <div class="sentence-mark" style="width:30px;"></div>
              <div style="width:50px; line-height:17px;">已标注</div>
              <div style="padding-left:40px; width:100px; line-height:17px;">
                <el-button :disabled="currentPage === 1" @click="handlePrevPage">
                  <i class="el-icon-arrow-left"></i>
                </el-button>
                <span>{{ currentPage }}/{{Math.ceil(fullDataLength / currentSize)}}</span>
                <el-button
                  :disabled="currentPage === fullDataLength / currentSize"
                  @click="handleNextPage"
                >
                  <i class="el-icon-arrow-right"></i>
                </el-button>
              </div>
            </div>
            <div slot="reference" class="mark-situation">
              <span>当前标注情况</span>
            </div>
          </el-popover>
        </template>
        <el-button
          style="margin-left: 10px; color: rgb(44, 164, 243); height: 42px;"
          @click="toFileDownload"
        >文件下载</el-button>
        <el-button
          style="margin-left: 10px; color: rgb(44, 164, 243); height: 42px;"
          @click="$router.push('/Login')"
        >退出登录</el-button>
        <!-- <div class="user-prop">
          {{ key1 }}
          <br />
          {{ key2 }}
        </div>-->
      </div>
      <div style="margin-top:10px;">
        <ul class="qagroup" v-if="labelDescribe.length > 0">
          <li style="color: red;">标签：{{labelDescribe[0]}}</li>
          <li style="color: rgb(44, 46, 46);">解释：{{labelDescribe[1]}}</li>
          <li style="color: #4799FC;">例句：{{labelDescribe[2]}}</li>
        </ul>
      </div>
      <!-- 搜索结果显示 -->
      <div
        class="search-result"
        v-if="searchResult.length > 0 && (mclasseng == 'intention' || mclasseng == 'action')"
      >
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
      <div class="search-result" v-else-if="searchResult.length > 0 && mclasseng == 'cqa'">
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
      <div class="search-result" v-else-if="searchResult.length > 0 && mclasseng == 'graph'">
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
      <div class="search-result" v-else-if="searchResult.length > 0 && mclasseng == 'session'">
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
// eslint-disable-next-line to ignore the next line.
export default {
  name: "classify",
  data() {
    return {
      intentionDataStatus: ["意图"],

      graphIndex: 0,
      index: 0,
      pre: 0,

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

      tmpNerString: "",

      cqaLabels: ["通用FAQ", "删除FAQ", "个性FAQ"],
      highlight: [],
      colorMap: {
        通用FAQ: "color-B",
        删除FAQ: "color-D",
        个性FAQ: "color-C"
      },
      dialogs: [
        {
          dialog_id: 0,
          sentence_id: 0,
          role: "CLIENT",
          sentence:
            "康肃问曰：”汝亦知射乎？吾射不亦精乎？”翁曰：”无他， 但手熟尔。”"
        }
      ],
      deltaY: 0,
      entity: {},
      entities: [],
      twoEntity: [],
      relation: "",
      tmpRelation: [],
      twoRelation: [],
      twoRelations: {},
      relationButtons: [
        "可能病因",
        "拥有医生",
        "需做的检查",
        "可用的手术方式",
        "可用的食疗方式",
        "可用的药物治疗方式",
        "可用的其他治疗方式",
        "需用到的仪器",
        "可能的症状",
        "可能的内因",
        "可用的治疗方式",
        "忌吃食物",
        "宜吃食物",
        "关联的部位",
        "关联的病毒",
        "拥有子实体",
        "同义的实体"

        // "可用的食疗方式",
        // "忌吃食物",
        // "宜吃食物",
        // "拥有子实体",
        // "同义的实体"
      ],
      singlerelationButtons: [
        // 关系抽取
        "需做的检查",
        "需用到的仪器材料",
        "可用的其他治疗方式",
        // "可能的外因",
        "可能的症状",
        "可用的手术方式",
        "关联的部位器官",
        "可能的病因",
        "可用的流产方式",
        "检查结果的推测",
        "合理的测试时间",
        "测试结果的有效时长",
        "可能影响怀孕的因素",
        "术前需做的检查",
        "术后需做的检查",
        "影响检查结果的因素",
        // "确认怀孕的检查",

        // 关系识别
        // "需做的检查",
        // "需用到的仪器材料",
        "可用的治疗方式",
        // "可用的其他治疗方式",
        // "可能的病因",
        // "可能的症状",
        // "可用的手术方式",
        // "关联的部位器官",
        // "可用的流产方式",
        // "检查结果的推测",
        // "合理的测试时间",
        // "测试结果的有效时长",
        // "可能影响怀孕的因素",
        // "问关系x",
        // "术前需做的检查",
        // "术后需做的检查",
        // "影响检查结果的因素",
        "症状",
        "时长",
        "时间点",
        "检查结果",
        "属性",

        "问关系",
        // "条件"
        // "关联的部位",
        // "关联的症状",
        // "关联的病毒",
        // "需做的检查",
        // "可用的其他治疗方式",
        // "可用的手术方式",
        // "需要用到的仪器",
        // "可能病因"
      ],

      intentionDataStatusMap: {
        NER: "ner",
        意图: "label",
        二元组: "tuple"
      },
      intentionDataStatusEng: [],

      relationMap: {
        symptom: "可能的症状",
        part: "关联的部位",
        cause: "可能病因",
        virus: "关联的病毒",
        check: "需做的检查",
        surgery: "可用的手术方式",
        othertreatment: "可用的其他治疗方式",
        doctor: "拥有医生",
        tool: "需用到的仪器"
      },
      // 远端文件选择的时候用
      unMarkFiles: [],
      unNameFiles: [],
      // 选择标注的任务类型，默认“意图”
      mclasseng: "intention",
      mclass: "意图",

      title: "",
      dialogTableVisible: false,
      checkData: [],

      status: true,
      markClass: [
        {
          value: "cqa",
          label: "cqa"
        },
        {
          value: "intention",
          label: "意图"
        },
        {
          value: "graph",
          label: "graph"
        },
        {
          value: "session",
          label: "会话"
        },
        {
          value: "similary",
          label: "相似句",
          disabled: true
        },
        {
          value: "action",
          label: "动作"
        }
      ],

      currentSize: 100,
      currentPage: 1,

      entitiesClickCount: 0,

      tagVisible: false,
      tagValue: "",

      whichPage: [],

      start: 0, //拉取的文字在html标签里的起始位置
      end: 0, //拉取的文字在html标签里的结束位置
      anchorOffset: 0, //拉取的文字第一个字在标签内起始位置
      extentOffset: 0, //拉取的文字最后一个字在标签内结束位置

      popoverId: 0,
      checkList: [],
      checkListTF: {
        sentence_id: true,
        role: true,
        // "sentence": false,
        entity: true,
        local_topic: true,
        global_topic: true,
        confirm_entity: true,
        unconfirm_entity: true,
        intention: true,
        action: true,
        qa: true
      },

      pre_sentence_id: 0,
      pre_type: "",
      qaSentenceId: -1,

      nerVisible: false,
      currentSentenceId: 0,
      fullData: [],
      onlineNERS: {},
      flipGraph: [{ dialog_id: 0 }],
      flipCqa: [],
      flipSession: [],
      origin: "",
      session: [],
      classificationValue: [],
      actions: [
        {
          value: "其他",
          label: "其他",
          children: [
            {
              value: "邀约",
              label: "邀约"
            },
            {
              value: "套电",
              label: "套电"
            },
            {
              value: "套电成功",
              label: "套电成功"
            },
            {
              value: "套电失败",
              label: "套电失败"
            },
            {
              value: "介绍看不到图片",
              label: "介绍看不到图片"
            },
            {
              value: "建议去其他医院",
              label: "建议去其他医院"
            },
            {
              value: "欢迎语",
              label: "欢迎语"
            },
            {
              value: "介绍预约时间",
              label: "介绍预约时间"
            },
            {
              value: "询问预约时间",
              label: "询问预约时间"
            }
          ]
        },
        {
          value: "询问基础信息",
          label: "询问基础信息",
          children: [
            {
              value: "询问姓名",
              label: "询问姓名"
            },
            {
              value: "询问性别",
              label: "询问性别"
            },
            {
              value: "询问是否本人",
              label: "询问是否本人"
            },
            {
              value: "询问年龄",
              label: "询问年龄"
            },
            {
              value: "询问地址",
              label: "询问地址"
            },
            {
              value: "询问婚育史",
              label: "询问婚育史"
            },
            {
              value: "询问访客有什么问题",
              label: "询问访客有什么问题"
            },
            {
              value: "询问上班相关",
              label: "询问上班相关"
            },
            {
              value: "询问其他基本信息",
              label: "询问其他基本信息"
            }
          ]
        },
        {
          value: "询问性生活相关",
          label: "询问性生活相关",
          children: [
            {
              value: "询问晨勃频率",
              label: "询问晨勃频率"
            },
            {
              value: "询问勃起硬度",
              label: "询问勃起硬度"
            },
            {
              value: "询问勃起长度",
              label: "询问勃起长度"
            },
            {
              value: "询问精量",
              label: "询问精量"
            },
            {
              value: "询问性生活时长",
              label: "询问性生活时长"
            },
            {
              value: "询问性生活频率",
              label: "询问性生活频率"
            },
            {
              value: "询问性生活对象或场所",
              label: "询问性生活对象或场所"
            },
            {
              value: "询问手淫频率",
              label: "询问手淫频率"
            },
            {
              value: "询问手淫史",
              label: "询问手淫史"
            }
          ]
        },
        {
          value: "询问治疗相关",
          label: "询问治疗相关",
          children: [
            {
              value: "询问用药史",
              label: "询问用药史"
            },
            {
              value: "询问检查医院",
              label: "询问检查医院"
            },
            {
              value: "询问治疗医院",
              label: "询问治疗医院"
            },
            {
              value: "询问检查结果",
              label: "询问检查结果"
            },
            {
              value: "询问治疗结果",
              label: "询问治疗结果"
            },
            {
              value: "询问检查方式",
              label: "询问检查方式"
            },
            {
              value: "询问治疗方式",
              label: "询问治疗方式"
            },
            {
              value: "询问检查史",
              label: "询问检查史"
            },
            {
              value: "询问治疗史",
              label: "询问治疗史"
            },
            {
              value: "询问治疗意向",
              label: "询问治疗意向"
            }
          ]
        },
        {
          value: "询问症状相关",
          label: "询问症状相关",
          children: [
            {
              value: "询问患病时长",
              label: "询问患病时长"
            },
            {
              value: "询问病症表现",
              label: "询问病症表现"
            },
            {
              value: "询问症状发生频率",
              label: "询问症状发生频率"
            },
            {
              value: "询问部位",
              label: "询问部位"
            },
            {
              value: "询问不良习惯",
              label: "询问不良习惯"
            },
            {
              value: "询问发图片",
              label: "询问发图片"
            }
          ]
        },
        {
          value: "介绍医院相关",
          label: "介绍医院相关",
          children: [
            {
              value: "介绍其他医院",
              label: "介绍其他医院"
            },
            {
              value: "介绍医院",
              label: "介绍医院"
            },
            {
              value: "介绍地址和路线",
              label: "介绍地址和路线"
            },
            {
              value: "介绍专家",
              label: "介绍专家"
            },
            {
              value: "介绍案例",
              label: "介绍案例"
            },
            {
              value: "介绍上班时间",
              label: "介绍上班时间"
            },
            {
              value: "介绍公立私立",
              label: "介绍公立私立"
            }
          ]
        },
        {
          value: "介绍危害相关",
          label: "介绍危害相关",
          children: [
            {
              value: "介绍病症危害",
              label: "介绍病症危害"
            },
            {
              value: "介绍药物危害",
              label: "介绍药物危害"
            },
            {
              value: "介绍严重程度",
              label: "介绍严重程度"
            },
            {
              value: "介绍危害",
              label: "介绍危害"
            }
          ]
        },
        {
          value: "介绍手术相关",
          label: "介绍手术相关",
          children: [
            {
              value: "介绍手术介绍",
              label: "介绍手术介绍"
            },
            {
              value: "介绍手术时长",
              label: "介绍手术时长"
            },
            {
              value: "介绍手术恢复期",
              label: "介绍手术恢复期"
            }
          ]
        },
        {
          value: "介绍治疗相关",
          label: "介绍治疗相关",
          children: [
            {
              value: "介绍检查时长",
              label: "介绍检查时长"
            },
            {
              value: "介绍治疗方式",
              label: "介绍治疗方式"
            },
            {
              value: "介绍后遗症",
              label: "介绍后遗症"
            },
            {
              value: "介绍药物",
              label: "介绍药物"
            },
            {
              value: "介绍要对症下药",
              label: "介绍要对症下药"
            },
            {
              value: "介绍食疗",
              label: "介绍食疗"
            },
            {
              value: "介绍疗程",
              label: "介绍疗程"
            },
            {
              value: "介绍疗效",
              label: "介绍疗效"
            },
            {
              value: "介绍住院",
              label: "介绍住院"
            }
          ]
        },
        {
          value: "介绍病症相关",
          label: "介绍病症相关",
          children: [
            {
              value: "介绍病因",
              label: "介绍病因"
            },
            {
              value: "介绍传染",
              label: "介绍传染"
            },
            {
              value: "介绍疑似病症",
              label: "介绍疑似病症"
            },
            {
              value: "介绍介绍病症",
              label: "介绍介绍病症"
            },
            {
              value: "介绍注意事项",
              label: "介绍注意事项"
            },
            {
              value: "介绍生理常识",
              label: "介绍生理常识"
            }
          ]
        },
        {
          value: "介绍项目相关",
          label: "介绍项目相关",
          children: [
            {
              value: "介绍价格",
              label: "介绍价格"
            },
            {
              value: "介绍价格区别",
              label: "介绍价格区别"
            },
            {
              value: "介绍项目区别",
              label: "介绍项目区别"
            },
            {
              value: "介绍医保",
              label: "介绍医保"
            },
            {
              value: "介绍优惠活动",
              label: "介绍优惠活动"
            },
            {
              value: "介绍项目介绍",
              label: "介绍项目介绍"
            }
          ]
        }
      ],
      intents: [
        {
          value: "咨询其他",
          label: "咨询其他",
          children: [
            {
              value: "咨询生理常识",
              label: "咨询生理常识"
            },
            {
              value: "咨询注意事项",
              label: "咨询注意事项"
            },
            {
              value: "无",
              label: "无"
            }
          ]
        },
        {
          value: "咨询医疗费用相关",
          label: "咨询医疗费用相关",
          children: [
            {
              value: "咨询优惠活动",
              label: "咨询优惠活动"
            },
            {
              value: "咨询价格",
              label: "咨询价格"
            },
            {
              value: "咨询医保",
              label: "咨询医保"
            }
          ]
        },
        {
          value: "咨询医院相关",
          label: "咨询医院相关",
          children: [
            {
              value: "咨询路线",
              label: "咨询路线"
            },
            {
              value: "咨询地址",
              label: "咨询地址"
            },
            {
              value: "咨询公立私立",
              label: "咨询公立私立"
            },
            {
              value: "咨询公司介绍",
              label: "咨询公司介绍"
            },
            {
              value: "咨询挂号",
              label: "咨询挂号"
            },
            {
              value: "咨询上班时间",
              label: "咨询上班时间"
            },
            {
              value: "咨询专家",
              label: "咨询专家"
            }
          ]
        },
        {
          value: "咨询手术相关",
          label: "咨询手术相关",
          children: [
            {
              value: "咨询手术介绍",
              label: "咨询手术介绍"
            },
            {
              value: "咨询术后注意事项",
              label: "咨询术后注意事项"
            },
            {
              value: "咨询手术恢复期",
              label: "咨询手术恢复期"
            },
            {
              value: "咨询手术时长",
              label: "咨询手术时长"
            }
          ]
        },
        {
          value: "咨询检查相关",
          label: "咨询检查相关",
          children: [
            {
              value: "咨询检查方式",
              label: "咨询检查方式"
            },
            {
              value: "咨询检查价格",
              label: "咨询检查价格"
            },
            {
              value: "咨询检查时长",
              label: "咨询检查时长"
            }
          ]
        },
        {
          value: "咨询治疗相关",
          label: "咨询治疗相关",
          children: [
            {
              value: "咨询疗效",
              label: "咨询疗效"
            },
            {
              value: "咨询疗程",
              label: "咨询疗程"
            },
            {
              value: "咨询药物",
              label: "咨询药物"
            },
            {
              value: "咨询治疗方式",
              label: "咨询治疗方式"
            },
            {
              value: "咨询住院",
              label: "咨询住院"
            },
            {
              value: "咨询副作用",
              label: "咨询副作用"
            },
            {
              value: "咨询食疗",
              label: "咨询食疗"
            },
            {
              value: "咨询项目介绍",
              label: "咨询项目介绍"
            },
            {
              value: "咨询疼痛程度",
              label: "咨询疼痛程度"
            }
          ]
        },
        {
          value: "咨询疾病相关",
          label: "咨询疾病相关",
          children: [
            {
              value: "咨询危害",
              label: "咨询危害"
            },
            {
              value: "咨询传染",
              label: "咨询传染"
            },
            {
              value: "咨询病因",
              label: "咨询病因"
            },
            {
              value: "咨询症状",
              label: "咨询症状"
            },
            {
              value: "咨询案例",
              label: "咨询案例"
            },
            {
              value: "咨询图片",
              label: "咨询图片"
            }
          ]
        },
        {
          value: "套电相关",
          label: "套电相关",
          children: [
            {
              value: "提供联系方式",
              label: "提供联系方式"
            },
            {
              value: "拒绝套电邀约",
              label: "拒绝套电邀约"
            },
            {
              value: "咨询QQ",
              label: "咨询QQ"
            },
            {
              value: "咨询电话",
              label: "咨询电话"
            },
            {
              value: "咨询微信",
              label: "咨询微信"
            },
            {
              value: "咨询预约",
              label: "咨询预约"
            },
            {
              value: "确定预约",
              label: "确定预约"
            }
          ]
        },
        {
          value: "描述类",
          label: "描述类",
          children: [
            {
              value: "描述就诊史",
              label: "描述就诊史"
            },
            {
              value: "描述症状",
              label: "描述症状"
            },
            {
              value: "描述用药史",
              label: "描述用药史"
            },
            {
              value: "描述不良习惯",
              label: "描述不良习惯"
            },
            {
              value: "描述时长",
              label: "描述时长"
            },
            {
              value: "描述性生活",
              label: "描述性生活"
            },
            {
              value: "描述性别年龄",
              label: "描述性别年龄"
            },
            {
              value: "描述婚育史",
              label: "描述婚育史"
            },
            {
              value: "否认症状",
              label: "否认症状"
            },
            {
              value: "描述患病时长",
              label: "描述患病时长"
            }
          ]
        }
      ],
      ners: {
        症状: "symptom",
        部位器官: "part",
        疾病: "item",
        病因: "cause",
        // 细菌病毒: "virus",
        // 外因: "cause",
        // 内因: "innercause",
        仪器材料: "tool",
        检查: "check",
        手术: "surgery",
        其他治疗方式: "othertreatment",
        生理现象: "physiology",
        // 情绪: "emotion",
        // 频率: "frequency",
        体液: "fluid",
        // 年龄: "age",
        专家: "doctor",
        体内分泌: "secretion",
        姓名: "name",
        机构组织: "org",
        年龄: "age",
        地址: "address",
        价格: "price",
        // 时间: "datetime",
        // 医生: "doctor",
        妇科时期: "datetime",
        时长: "period",
        时点: "timestamp",
        时段: "timeslot",
        检查结果: "checkresult",
        否定症状: "unsymptom",
        否定病因: "uncause",
        否定生理现象: "unphysiology",
        否定疾病: "unsickness",
        药物: "medicine",
        目的: "purpose"
      },
      catchWords: "",
      currentRole: "",
      currentDialogId: 0,
      currentColumn: "",
      fullDataLength: 100,
      searchResult: [],
      question: "",
      filename: "",
      server: "",
      department: "",
      url: "",
      uploadurl: "",
      labelDescribe: [],
      labelCategories: [
        // {
        //   text: "介绍症状",
        //   describe:
        //     "介绍自身的病症或状态以及程度。（身高体重年龄等与症状无关的属性不属于介绍症状）",
        //   example: "我胸太大了。"
        // }
      ],

      permission: -1,
      user: {}
    };
  },

  created: function() {
    // console.log('window',document.getElementById('input2') );
    // console.log(this.inputq)
    // document.getElementById('input2').style.background = "orange"
    // this.$router.push('/FileDownload')
    document.oncontextmenu = function(event) {
      event.preventDefault();
    };

    this.url = this.$getUrl();
    this.uploadurl = this.url + "uploadFile/";

    this.$axios({
      method: "GET",
      url: this.url + "getUserInfo/"
    }).then(res => {
      console.log("userinfo:", res["data"]["content"]);
      if (res["data"]["code"] === 200) {
        this.permission = res["data"]["content"]["permission"];
        this.user = res["data"]["content"];
        sessionStorage.setItem("permission", this.permission);

        this.reqUnMarkFiles(this.mclasseng);
      } else if (res["data"]["code"] === 201) {
        localStorage.removeItem("token");
        // sessionStorage.removeItem("permission")
        this.$router.push("/Login");
      } else {
        this.$message({
          message: res["data"]["content"],
          type: "error",
          duration: 3000
        });
        localStorage.removeItem("token");
        this.$router.push("/Login");
      }
    }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
  },

  computed: {
    // key1: function() {
    //   if (this.userKey1 === "") {
    //     return;
    //   }
    //   return "上翻：" + this.keyCodeMap(this.userKey1);
    // },
    // key2: function() {
    //   if (this.userKey2 === "") {
    //     return;
    //   }
    //   return "下翻：" +ASDASDA this.keyCodeMap(this.userKey2);
    // }
  },

  methods: {
    // 请求没标注完的文件
    reqUnMarkFiles(mclasseng, zh_name) {
      this.mclasseng = mclasseng;
      if (zh_name === undefined) {
        var zh_name = this.user.zh_name;
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
          this.unMarkFiles = [];
          this.unNameFiles = [];
          // 未标注文件
          for (var i = 0; i < res["data"]["data"][0].length; i++) {
            var tmp = {};
            tmp["value"] = res["data"]["data"][0][i]["file"];
            tmp["label"] = res["data"]["data"][0][i]["file"];
            this.unMarkFiles.push(tmp);
          }
          // 未分配文件
          for (var i = 0; i < res["data"]["data"][1].length; i++) {
            var tmp = {};
            tmp["value"] = res["data"]["data"][1][i]["file"];
            tmp["label"] = res["data"]["data"][1][i]["file"];
            this.unNameFiles.push(tmp);
          }
          console.log(this.unMarkFiles, this.unNameFiles);
        }
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
    },
    // 跳转下载页
    toFileDownload() {
      this.$router.push({
        name: "FileDownload"
      });
    },
    choseFile() {
      // console.log(this.mclasseng)
      this.fullData = [];
      // this.session = [];
      // this.dialogs = [];
      if (this.mclasseng == "action" || this.mclasseng == "intention") {
        this.readConfig();
      }
      this.$axios({
        method: "GET",
        url: this.url + "reqFromFileName/",
        params: {
          filename: this.filename
        }
      }).then(res => {
        if (res["data"]["code"] == 200) {
          this.uploadSuccess(res["data"], this.filename);
        }
      });
      this.currentPage = 1;
      this.index = 0;
    },
    up() {
      if (this.index == 0) {
        // this.$message({
        //   message: "已经是第一个了",
        //   type: "error",
        //   duration: 2000
        // });
        return;
      }
      this.index -= 1;
    },
    down() {
      // console.log(this.index, this.marked_id)
      if (this.index == this.fullDataLength - 1) {
        // this.$message({
        //   message: "已经是最后一个了",
        //   type: "error",
        //   duration: 2000
        // });
        return;
      } else {
        this.index += 1;
      }
    },

    clickResult(item) {
      if (this.mclasseng == "cqa") {
        this.pre = parseInt(item["index"] / 4);
        this.moveToFlipCqa();
        return;
      } else if (this.mclasseng == "graph") {
        this.pre = item["index"];
        this.flipGraph = this.dialogs[this.pre];
        this.entity = this.entities[this.pre];
        this.highlight = [];
        return;
      } else if (this.mclasseng == "session") {
        this.pre = item["index"];
        this.flipSession = this.session[this.pre];
        return;
      }
      this.index = item["index"];
      this.intention = this.fullData[this.index];
    },

    intentionSingleDataStatusChange(intentionDataStatus, idx) {
      if (intentionDataStatus.length == 1) {
          if (this.fullData[idx][intentionDataStatus[0]].length != '') {
            if (intentionDataStatus.indexOf("ner") != -1) {
              if (Object.values(this.fullData[idx]["ner"]).flat(Infinity).length > 1) {
                // console.log(idx, Object.values(this.fullData[idx]["ner"]).flat(Infinity).length)
                this.fullData[idx]["mark"] = "sentence-mark"
              } else {
                this.fullData[idx]["mark"] = "sentence-no-mark"
              }
            } else {
              this.fullData[idx]["mark"] = "sentence-mark"
            }
          } else {
            this.fullData[idx]["mark"] = "sentence-no-mark"
          }
        } else if (intentionDataStatus.length == 2) {
          if (this.fullData[idx][intentionDataStatus[0]].length != '' && this.fullData[idx][intentionDataStatus[1]].length != '') {
            if (intentionDataStatus.indexOf("ner") != -1) {
              if (Object.values(this.fullData[idx]["ner"]).flat(Infinity).length > 1) {
                this.fullData[idx]["mark"] = "sentence-mark"
              } else {
                this.fullData[idx]["mark"] = "sentence-no-mark"
              }
            } else {
              this.fullData[idx]["mark"] = "sentence-mark"
            }
          } else {
            this.fullData[idx]["mark"] = "sentence-no-mark"
          }
        } else {
          if (this.fullData[idx][intentionDataStatus[0]].length != '' && this.fullData[idx][intentionDataStatus[1]].length != '' && this.fullData[idx][intentionDataStatus[2]].length != '') {
            if (intentionDataStatus.indexOf("ner") != -1) {
              if (Object.values(this.fullData[idx]["ner"]).flat(Infinity).length > 1) {
                this.fullData[idx]["mark"] = "sentence-mark"
              } else {
                this.fullData[idx]["mark"] = "sentence-no-mark"
              }
            } else {
              this.fullData[idx]["mark"] = "sentence-mark"
            }
          } else {
            this.fullData[idx]["mark"] = "sentence-no-mark"
          }
        }
    },

    intentionDataStatusChineseToEng() {
      // 把统计的中文转换成英文
      this.intentionDataStatusEng = []
      for (let each in this.intentionDataStatus) {
        this.intentionDataStatusEng.push(this.intentionDataStatusMap[this.intentionDataStatus[each]])
      }
    },

    intentionDataStatusChange(){
      // 修改统计方式
      // 把统计的中文转换成英文
      this.intentionDataStatusChineseToEng()

      for (let idx in this.fullData) {
        this.intentionSingleDataStatusChange(this.intentionDataStatusEng, idx)
      }

      // if (intentionDataStatus.length == 1) {
      //   for (let idx in this.fullData) {
      //     if (this.fullData[idx][intentionDataStatus[0]].length != '') {
      //       if (intentionDataStatus.indexOf("ner") != -1) {
      //         if (this.fullData[idx]["ner"]["None"].length == 2) {
      //           this.fullData[idx]["mark"] = "sentence-mark"
      //         }
      //       } else {
      //         this.fullData[idx]["mark"] = "sentence-mark"
      //       }
      //     } else {
      //       this.fullData[idx]["mark"] = "sentence-no-mark"
      //     }
      //   }
      // } else if (intentionDataStatus.length == 2) {
      //   for (let idx in this.fullData) {
      //     if (this.fullData[idx][intentionDataStatus[0]].length != '' && this.fullData[idx][intentionDataStatus[1]].length != '') {
      //       if (intentionDataStatus.indexOf("ner") != -1) {
      //         if (this.fullData[idx]["ner"]["None"].length == 2) {
      //           this.fullData[idx]["mark"] = "sentence-mark"
      //         }
      //       } else {
      //         this.fullData[idx]["mark"] = "sentence-mark"
      //       }
      //     } else {
      //       this.fullData[idx]["mark"] = "sentence-no-mark"
      //     }
      //   }
      // } else {
      //   for (let idx in this.fullData) {
      //     if (this.fullData[idx][intentionDataStatus[0]].length != '' && this.fullData[idx][intentionDataStatus[1]].length != '' && this.fullData[idx][intentionDataStatus[2]].length != '') {
      //       if (intentionDataStatus.indexOf("ner") != -1) {
      //         if (this.fullData[idx]["ner"]["None"].length == 2) {
      //           this.fullData[idx]["mark"] = "sentence-mark"
      //         }
      //       } else {
      //         this.fullData[idx]["mark"] = "sentence-mark"
      //       }
      //     } else {
      //       this.fullData[idx]["mark"] = "sentence-no-mark"
      //     }
      //   }
      // }
      this.$forceUpdate();
      // console.log(intentionDataStatus, this.intentionDataStatus, this.fullData)
    },

    showInput() {
      this.tagVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },

    handleTagConfirm(scope, column) {
      let sentence_id = scope.row.sentence_id;
      let tagValue = this.tagValue;

      if (tagValue) {
        this.flipSession[sentence_id][column].push(tagValue);
      }
      this.tagVisible = false;
      this.tagValue = "";
      this.annotatorRow(scope.row);
    },

    /**
     * 判断拉取文字的头尾标签是否相同
     * 如果不同表示其中参有tag标签
     * */
    isSameTag() {
      if (this.anchorId === this.extentId) {
        this.isTagSame = true;
      }
      if (this.anchorOffset == this.focusOffset) {
        this.isTagSame = false;
      }
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

    intentionNer(ner) {
      if (this.catchWords.length == 0) {
        return;
      }
      let start = this.start;
      let end = this.end;
      let nerResult = start + "$" + end + "$" + ner + "@" + this.catchWords;
      // 数据处理
      // 缓存NER标注结果
      if (ner in this.fullData[this.index]["ner"]) {
        this.fullData[this.index]["ner"][ner].push(nerResult);
        this.fullData[this.index]["ner"][ner] = this.UniqueArray(
          this.fullData[this.index]["ner"][ner]
        );
      } else {
        this.fullData[this.index]["ner"][ner] = [];
        this.fullData[this.index]["ner"][ner].push(nerResult);
      }

      // this.fullData[this.index]["mark"] = "sentence-mark";

      this.catchWords = "";
      window.getSelection().removeAllRanges();

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner_ = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner_, tuple);
    },

    genTuple(intention) {
      if (this.tmpNerString.length != 0) {
        this.fullData[this.index]["tuple"].push(
          [intention, this.tmpNerString].join("#")
        );
        this.fullData[this.index]["tuple"] = this.UniqueArray(
          this.fullData[this.index]["tuple"]
        );
      } else {
        return;
      }
      // 标注进度更新
      // if (this.fullData[this.index]["tuple"].length != 0) {
      //   this.fullData[this.index]["mark"] = "sentence-mark";
      // }
      // 更新前端  更新后端
      this.$forceUpdate();

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
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

      // var len = this.twoRelations[this.flipGraph[0]["dialog_id"]].length;
      // this.$set(this.twoRelations[this.flipGraph[0]["dialog_id"]], len, nerResult);

      // 判断当前对话是否有 ner 这个实体
      // 没有则创建，有则添加后去重
      if (this.onlineNERS[this.flipGraph[0]["dialog_id"]] == undefined) {
        this.onlineNERS[this.flipGraph[0]["dialog_id"]] = {
          None: ["0$0$0$None@None"]
        };
      }
      if (ner in this.onlineNERS[this.flipGraph[0]["dialog_id"]]) {
        this.onlineNERS[this.flipGraph[0]["dialog_id"]][ner].push(nerResult);
        this.onlineNERS[this.flipGraph[0]["dialog_id"]][ner] = this.UniqueArray(
          this.onlineNERS[this.flipGraph[0]["dialog_id"]][ner]
        );
      } else {
        this.onlineNERS[this.flipGraph[0]["dialog_id"]][ner] = [];
        this.onlineNERS[this.flipGraph[0]["dialog_id"]][ner].push(nerResult);
      }
      this.$forceUpdate();
      // 更新整体的实体

      this.graphUpload(nerResult);
      // this.fullData[this.pre]["mark"] = "sentence-mark";

      this.catchWords = "";
      window.getSelection().removeAllRanges();
    },

    annotatorNer(sentence_id, ner) {
      this.nerVisible = false;
      var annotatorResult =
        ner + "#" + this.catchWords + "@" + this.start + "#" + this.end;
      // console.log(this.flipSession[sentence_id]["entity"]);
      this.flipSession[sentence_id]["entity"].push(annotatorResult);
      this.catchWords = "";
      window.getSelection().removeAllRanges();
      // console.log(this.start, this.end);
      // console.log(this.flipSession[this.popoverId]["entity"]);
      // console.log(ner + "#" + this.catchWords);
    },

    deleteTag(row, col, tag) {
      let sentence_id = row.sentence_id;
      let idx = this.flipSession[sentence_id][col].indexOf(tag);
      // 删除实体
      this.flipSession[sentence_id][col].splice(idx, 1);

      // 更新后端
      this.annotatorRow(this.flipSession[sentence_id]);
    },

    locaSentence(id) {
      if (this.mclasseng == "graph") {
        this.pre = id;
        this.nextGraph();
        return;
      } else if (this.mclasseng == "cqa") {
        this.index = id;
        this.pre = parseInt(id / 4);
        this.moveToFlipCqa();
      } else if (this.mclasseng == "session") {
        this.index = id;
        this.clearSessionTmp();
      } else {
        this.index = id;
      }
    },

    handlePrevPage() {
      if (this.currentPage === 1) {
        return;
      }
      this.currentPage -= 1;
    },
    handleNextPage() {
      if (this.currentPage === this.fullDataLength) {
        return;
      }
      this.currentPage += 1;
    },

    selectClsPage(e) {
      if (e["deltaY"] > 0) {
        this.down();
      } else {
        this.up();
      }
      this.tmpNerString = "";
      this.catchWords = "";
      this.start = 0;
      this.end = 0;
    },

    // 滚轮知识图谱翻页
    selectGraphPage(e) {
      let dialog_id = this.flipGraph[0]["dialog_id"];
      let relationLength = 0;

      if (e["deltaY"] > 0) {
        this.pre += 1;
      } else {
        this.pre -= 1;
      }
      // }
      // index 溢出操作
      if (this.pre < 0) {
        this.pre = 0;
        return;
      } else if (this.pre == this.dialogs.length) {
        this.pre = this.dialogs.length - 1;
      }
      this.nextGraph();
    },

    nextGraph() {
      this.deltaY = 0;
      this.twoEntity = [];
      this.catchWords = "";
      this.entitiesClickCount = 0;
      this.entity = this.entities[this.pre];
      this.flipGraph = this.dialogs[this.pre];
      this.highlight = [];
    },

    selectCqaPage(e) {
      if (e["deltaY"] > 0) {
        this.pre += 1;
      } else {
        this.pre -= 1;
      }
      if (this.pre < 0) {
        this.pre = 0;
        return;
      } else if (this.pre + 1 > parseInt(this.fullDataLength / 4)) {
        this.pre = parseInt(this.fullDataLength / 4) - 1;
        return;
      }
      this.moveToFlipCqa();
    },

    moveToFlipCqa() {
      this.flipCqa = this.fullData.slice(this.pre * 4, (this.pre + 1) * 4);
    },

    questionSearch() {
      // 判断数据是否存在
      if (typeof this.fullData == "undefined") {
        this.$message({
          message: "你还没传数据",
          type: "error",
          duration: 2000
        });
        return;
      }
      this.searchResult = [];
      // 首先判断是否是index搜索
      if (this.question.indexOf("index:") == 0) {
        var index = parseInt(this.question.substring(6));
        this.index = index;
        this.question = "";
        return;
      } else {
        if (this.question.length == 0) {
          this.searchResult = [];
          return;
        }
        // 判断上传的所有数据里面是否有符合搜索条件的句子
        if (this.mclasseng == "intention" || this.mclasseng == "action") {
          for (let i = 0; i < this.fullDataLength; i++) {
            if (
              this.fullData[i]["sentence"].match(this.question) ||
              this.fullData[i]["label"].indexOf(this.question) != -1
            ) {
              // console.log(this.fullData[i]["sentence"].match(this.question));

              let tmp = this.fullData[i];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            } else {
              // console.log(this.searchResult)
              continue;
            }
          }
          // this.searchResult.reverse();
        } else if (this.mclasseng == "cqa") {
          for (let i = 0; i < this.fullDataLength; i++) {
            if (
              this.fullData[i]["question"].match(this.question) ||
              this.fullData[i]["answer"].match(this.question) ||
              this.fullData[i]["context"].match(this.question) ||
              this.fullData[i]["label"].toString().match(this.question)
            ) {
              let tmp = this.fullData[i];
              tmp["index"] = i;
              this.searchResult.push(tmp);
            } else {
              // console.log(this.searchResult)
              continue;
            }
          }
          // this.searchResult.reverse();
          // console.log(this.searchResult);
        } else if (this.mclasseng == "graph") {
          for (let i = 0; i < this.fullDataLength; i++) {
            // 句子层面搜索
            let dialog_id = this.dialogs[i][0]["dialog_id"];
            for (let j = 0; j < this.dialogs[i].length; j++) {
              if (this.dialogs[i][j]["sentence"].match(this.question)) {
                let tmp = this.dialogs[i][j];
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
                  let tmp = this.dialogs[i][0];
                  tmp["index"] = i;
                  this.searchResult.push(tmp);
                } else {
                  // console.log(this.searchResult)
                  continue;
                }
              }
            } // this.dialogs[i]["sentence"].match(this.question)
          }
        } else if (this.mclasseng == "session") {
          // 需要修改成 this.fullDataLength
          for (let i = 0; i < this.session.length; i++) {
            for (let j = 0; j < this.session[i].length; j++) {
              if (this.session[i][j]["sentence"].match(this.question)) {
                let tmp = this.session[i][j];
                tmp["index"] = i;
                this.searchResult.push(tmp);
              } else {
                continue;
              }
            }
          }
        }
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
    // 知识图谱质检
    check() {
      this.$axios({
        method: "GET",
        url: this.url + "GraphCheck/",
        params: {
          dialog_id: this.flipGraph[0].dialog_id,
          filename: this.filename
        }
      }).then(res => {
        if (res["data"]["code"] == 200) {
          this.title = res["data"]["title"];
          this.checkData = res["data"]["data"];
        }
      });
    },

    highlightEntity(entity) {
      // 如果没有缓存，则添加
      if (this.highlight.indexOf(entity) == -1) {
        this.$set(this.highlight, this.highlight.length, entity);
      } else {
        // 如果有缓存，则删除
        let idx = this.highlight.indexOf(entity);
        this.highlight.splice(idx, 1);
      }
      console.log(this.highlight);
    },

    keyCodeMap(keyCode) {
      let keyList = {
        33: "Page Up",
        34: "Page Down",
        35: "End",
        36: "Home",
        37: "方向键左",
        38: "方向键上",
        39: "方向键右",
        40: "方向键下"
      };
      return keyList[keyCode];
    },

    back() {
      if (this.fullData[this.index].sentence == "") {
        this.$message({
          message: "data error",
          type: "error",
          duration: 1500
        });
        return;
      }
    },

    readConfig() {
      var department = this.filename.split("_")[0]

      this.$axios({
        method: "GET",
        url: this.url + "ReadConfig/",
        params: {
          department: department,
        }
      }).then(res => {
        if (res["data"]["code"] == 200) {
          this.labelCategories = res["data"]["data"]["config"];
          console.log(this.labelCategories);
        }
      });
    },

    getFileName(file, fileList) {
      // console.log(file["name"].split(".")[1]);
      console.log(file);
      if (
        file["name"].split(".")[1] == "intention" ||
        file["name"].split(".")[1] == "action" ||
        file["name"].split(".")[1] == "cqa" ||
        file["name"].split(".")[1] == "graph" ||
        file["name"].split(".")[1] == "json" ||
        file["name"].split(".")[1] == "xlsx" ||
        file["name"].split(".")[1] == "session"
      ) {
        this.filename = file.name;
        // 上传文件后修改mclasseng
        this.mclasseng = this.filename.split(".")[1];
        // 姓名_科室_xx.intention
        this.readConfig();
      } else {
        this.$message({
          message: "文件上传错误，检查一下后缀！",
          type: "error",
          duration: 2000
        });
        this.$refs.upload.clearFiles();
        this.$router.push("");
        return;
      }
    },

    submitUpload() {
      this.$refs.upload.submit();
    },

    uploadSuccess(response, filename) {
      // console.log(response);
      this.fullData = [];
      this.flipGraph = [{ dialog_id: 0 }];
      this.flipSession = [];

      if (response["code"] == 200) {
        if (this.mclasseng == "json") {
          console.log(response);
          this.$message({
            message: response["message"],
            type: "success",
            duration: 1500
          });
          return;
        }
        this.fullData = response["data"];

        console.log("response", this.fullData, this.filename);
        // 判断是否是管理员上传大份文件
        if (this.filename.indexOf("name") > -1 && this.fullData.length == 0) {
          this.reqUnMarkFiles(this.mclasseng, this.user.zh_name);
          return;
        } else if (this.fullData.length == 0) {
          // 判断文件是否被领取
          this.$message({
            message: "该文件已被领取",
            type: "error",
            duration: 1500
          });
          return;
        }

        this.filename = this.fullData[0]["file"];

        if (this.mclasseng == "cqa") {
          for (let i = 0; i < this.fullData.length; i++) {
            this.fullData[i]["id"] = i;
            if (this.fullData[i]["label"] == "") {
              this.fullData[i]["mark"] = "sentence-no-mark";
            } else {
              this.fullData[i]["mark"] = "sentence-mark";
            }
          }
        }
        if (this.mclasseng == "intention" || this.mclasseng == "action") {
          for (let i = 0; i < this.fullData.length; i++) {
            // 判断标签是否标注
            // 修改标签统计方式
            this.intentionDataStatusChineseToEng()
            this.intentionSingleDataStatusChange(this.intentionDataStatusEng, i)
            // if (this.fullData[i]["tuple"] == "") {
            //   this.fullData[i]["mark"] = "sentence-no-mark";
            // } else {
            //   this.fullData[i]["mark"] = "sentence-mark";
            // }
            this.fullData[i]["id"] = i;
            this.fullData[i]["color"] = "";
            // 判断意图
            if (this.fullData[i]["label"] == "") {
              this.fullData[i]["label"] = [];
            } else {
              this.fullData[i]["label"] = this.fullData[i]["label"].split(
                "@#$"
              );
            }
            // 判断NER
            if (this.fullData[i]["ner"] == "") {
              this.fullData[i]["ner"] = { None: ["0$0$None@None"] };
            } else {
              // console.log(this.fullData[i]["ner"] )
              this.fullData[i]["ner"] = this.fullData[i]["ner"].split("@#$");

              var each_ner = {};
              each_ner["None"] = ["0$0$None@None"];
              for (let each in this.fullData[i]["ner"]) {
                // console.log(this.fullData[i]["ner"][each])
                let entity_name = this.fullData[i]["ner"][each]
                  .split("$")[2]
                  .split("@")[0];
                if (entity_name in each_ner) {
                  each_ner[entity_name].push(this.fullData[i]["ner"][each]);
                } else {
                  each_ner[entity_name] = [];
                  each_ner[entity_name].push(this.fullData[i]["ner"][each]);
                }
              }
              this.fullData[i]["ner"] = each_ner;
            }
            // 判断二元组
            if (this.fullData[i]["tuple"] == "") {
              this.fullData[i]["tuple"] = [];
            } else {
              this.fullData[i]["tuple"] = this.fullData[i]["tuple"].split(
                "@#$"
              );
            }
          }
        }

        // 获取数据的长度
        this.fullDataLength = this.fullData.length;

        // console.log("marked_id: " + this.marked_id);
        // console.log("fullDataLength: " + this.fullDataLength);
        if (this.mclasseng == "cqa") {
          this.flipCqa = this.fullData.slice(this.pre, (this.pre + 1) * 4);
        } else if (this.mclasseng == "graph") {
          this.twoRelations = response["category"][0];
          this.onlineNERS = response["category"][1];
          console.log("two relations：", this.twoRelations);
          var dialog_id = this.fullData[0]["dialog_id"];
          // 每一个dialog 是一个临时变量
          var eachDialog = [];
          var dialogs = [];
          if (this.fullData[0]["dialog_id"] == this.fullData[1]["dialog_id"]) {
            for (
              this.graphIndex;
              this.graphIndex < this.fullDataLength;
              this.graphIndex++
            ) {
              if (this.fullData[this.graphIndex]["dialog_id"] == dialog_id) {
                eachDialog.push(this.fullData[this.graphIndex]);
              } else {
                if (eachDialog.length == 1) {
                  dialogs.push(eachDialog);
                  eachDialog = [];
                  eachDialog.push(this.fullData[this.graphIndex]);
                }
                dialogs.push(eachDialog);
                eachDialog = [];
                dialog_id = this.fullData[this.graphIndex + 1]["dialog_id"];
                eachDialog.push(this.fullData[this.graphIndex]);
              }
            }
            dialogs.push(eachDialog);
          } else {
            for (
              this.graphIndex;
              this.graphIndex < this.fullDataLength;
              this.graphIndex++
            ) {
              dialogs.push([this.fullData[this.graphIndex]]);
            }
          }

          this.fullData = response["content"];
          // 处理好的标签
          this.fullDataLength = dialogs.length;
          this.flipGraph = dialogs[0];
          this.dialogs = dialogs;

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
          // this.entity = this.onlineNERS[this.flipGraph[0]["dialog_id"]];
        } else if (this.mclasseng == "session") {
          var dialog_id = this.fullData[0]["dialog_id"];
          // 每一个dialog 是一个临时变量
          var eachDialog = [];
          var session = [];
          if (this.fullData[0]["dialog_id"] == this.fullData[1]["dialog_id"]) {
            for (
              this.graphIndex;
              this.graphIndex < this.fullDataLength;
              this.graphIndex++
            ) {
              if (this.fullData[this.graphIndex]["action"] == "") {
                this.fullData[this.graphIndex]["action"] = [];
              } else {
                this.fullData[this.graphIndex]["action"] = this.fullData[
                  this.graphIndex
                ]["action"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["intention"] == "") {
                this.fullData[this.graphIndex]["intention"] = [];
              } else {
                this.fullData[this.graphIndex]["intention"] = this.fullData[
                  this.graphIndex
                ]["intention"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["entity"] == "") {
                this.fullData[this.graphIndex]["entity"] = [];
              } else {
                this.fullData[this.graphIndex]["entity"] = this.fullData[
                  this.graphIndex
                ]["entity"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["confirm_entity"] == "") {
                this.fullData[this.graphIndex]["confirm_entity"] = [];
              } else {
                this.fullData[this.graphIndex][
                  "confirm_entity"
                ] = this.fullData[this.graphIndex]["confirm_entity"].split(
                  "@#$"
                );
              }

              if (this.fullData[this.graphIndex]["local_topic"] == "") {
                this.fullData[this.graphIndex]["local_topic"] = [];
              } else {
                this.fullData[this.graphIndex]["local_topic"] = this.fullData[
                  this.graphIndex
                ]["local_topic"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["global_topic"] == "") {
                this.fullData[this.graphIndex]["global_topic"] = [];
              } else {
                this.fullData[this.graphIndex]["global_topic"] = this.fullData[
                  this.graphIndex
                ]["global_topic"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["unconfirm_entity"] == "") {
                this.fullData[this.graphIndex]["unconfirm_entity"] = [];
              } else {
                this.fullData[this.graphIndex][
                  "unconfirm_entity"
                ] = this.fullData[this.graphIndex]["unconfirm_entity"].split(
                  "@#$"
                );
              }

              // if (this.fullData[this.graphIndex]["qa"] == "") {
              //   this.fullData[this.graphIndex]["qa"] = [];
              // } else {
              //   this.fullData[this.graphIndex][
              //     "qa"
              //   ] = this.fullData[this.graphIndex]["qa"].split(
              //     "@#$"
              //   );
              // }

              if (this.fullData[this.graphIndex]["dialog_id"] == dialog_id) {
                eachDialog.push(this.fullData[this.graphIndex]);
              } else {
                if (eachDialog.length == 1) {
                  session.push(eachDialog);
                  eachDialog = [];
                  eachDialog.push(this.fullData[this.graphIndex]);
                }
                session.push(eachDialog);
                eachDialog = [];
                dialog_id = this.fullData[this.graphIndex + 1]["dialog_id"];
                eachDialog.push(this.fullData[this.graphIndex]);
              }
            }
            session.push(eachDialog);
          } else {
            for (
              this.graphIndex;
              this.graphIndex < this.fullDataLength;
              this.graphIndex++
            ) {
              if (this.fullData[this.graphIndex]["action"] == "") {
                this.fullData[this.graphIndex]["action"] = [];
              } else {
                this.fullData[this.graphIndex]["action"] = this.fullData[
                  this.graphIndex
                ]["action"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["intention"] == "") {
                this.fullData[this.graphIndex]["intention"] = [];
              } else {
                this.fullData[this.graphIndex]["intention"] = this.fullData[
                  this.graphIndex
                ]["intention"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["entity"] == "") {
                this.fullData[this.graphIndex]["entity"] = [];
              } else {
                this.fullData[this.graphIndex]["entity"] = this.fullData[
                  this.graphIndex
                ]["entity"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["confirm_entity"] == "") {
                this.fullData[this.graphIndex]["confirm_entity"] = [];
              } else {
                this.fullData[this.graphIndex][
                  "confirm_entity"
                ] = this.fullData[this.graphIndex]["confirm_entity"].split(
                  "@#$"
                );
              }

              if (this.fullData[this.graphIndex]["local_topic"] == "") {
                this.fullData[this.graphIndex]["local_topic"] = [];
              } else {
                this.fullData[this.graphIndex]["local_topic"] = this.fullData[
                  this.graphIndex
                ]["local_topic"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["global_topic"] == "") {
                this.fullData[this.graphIndex]["global_topic"] = [];
              } else {
                this.fullData[this.graphIndex]["global_topic"] = this.fullData[
                  this.graphIndex
                ]["global_topic"].split("@#$");
              }

              if (this.fullData[this.graphIndex]["unconfirm_entity"] == "") {
                this.fullData[this.graphIndex]["unconfirm_entity"] = [];
              } else {
                this.fullData[this.graphIndex][
                  "unconfirm_entity"
                ] = this.fullData[this.graphIndex]["unconfirm_entity"].split(
                  "@#$"
                );
              }

              // if (this.fullData[this.graphIndex]["qa"] == "") {
              //   this.fullData[this.graphIndex]["qa"] = [];
              // } else {
              //   this.fullData[this.graphIndex][
              //     "qa"
              //   ] = this.fullData[this.graphIndex]["qa"].split(
              //     "@#$"
              //   );
              // }
              session.push([this.fullData[this.graphIndex]]);
            }
          }

          this.session = session;
          this.fullData = response["content"];
          this.fullDataLength = this.session.length;
          this.flipSession = this.session[0];
        }
      } else {
        // 文件上传错误的情况
        this.$message({
          message: response["data"],
          type: "error",
          duration: 2000
        });
      }
    },

    label_describe(label) {
      for (var cls in this.labelCategories) {
        for (var i in this.labelCategories[cls]) {
          if (label == this.labelCategories[cls][i]["text"]) {
            this.$set(this.labelDescribe, 0, label);
            this.$set(
              this.labelDescribe,
              1,
              this.labelCategories[cls][i]["describe"]
            );
            this.$set(
              this.labelDescribe,
              2,
              this.labelCategories[cls][i]["example"]
            );
            // console.log(this.labelDescribe);
            return;
          }
        }
      }
    },

    // 删除二元组
    deleteTuple(tuple) {
      let index = this.fullData[this.index]["tuple"].indexOf(tuple);
      this.fullData[this.index]["tuple"].splice(index, 1);
      // if (this.fullData[this.index]["tuple"].length != 0) {
      //   this.fullData[this.index]["mark"] = "sentence-mark";
      // } else {
      //   this.fullData[this.index]["mark"] = "sentence-no-mark";
      // }
      this.$forceUpdate();

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple_ = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple_);
    },

    // 删除意图ner联合标注的ner
    deleteNer(nereng, ner) {
      let index = this.fullData[this.index]["ner"][nereng].indexOf(ner);
      this.fullData[this.index]["ner"][nereng].splice(index, 1);
      if (this.fullData[this.index]["ner"][nereng].length == 0) {
        delete this.fullData[this.index]["ner"][nereng];
      }
      // if (Object.values(this.fullData[this.index]["ner"]).flat(Infinity).slice(1).join("@#$") == "") {
      //   this.fullData[this.index]["mark"] = "sentence-no-mark";
      // } else {
      //   this.fullData[this.index]["mark"] = "sentence-mark";
      // }
      this.$forceUpdate();

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner_ = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner_, tuple);
    },

    // 删除意图
    deleteLabel(val) {
      // console.log(val)
      this.fullData[this.index].label.splice(
        this.fullData[this.index].label.indexOf(val),
        1
      );
      // if (this.fullData[this.index].label.length == 0) {
      //   this.fullData[this.index]["mark"] = "sentence-no-mark";
      // }

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
    },

    // 数组去重
    UniqueArray(array) {
      var hash=[];
      for (var i = 0; i < array.length; i++) {
        if(hash.indexOf(array[i])==-1){
          hash.push(array[i]);
        }
      }
      return hash
      // return Array.from(new Set(array));
    },

    earlyUpload(category) {
      // 多意图则去掉第一个 [category] 的 []
      // 单意图则 this.fullData[this.index].label = [category];
      this.fullData[this.index].label = [category];
      return category

      if (this.fullData[this.index].label != "") {
        let tmp = this.fullData[this.index].label;
        tmp.push(category);
        category = this.UniqueArray(tmp);

        this.fullData[this.index].label = category;
        // console.log("上传的标签：" + category);
      } else {
        this.fullData[this.index].label = [category];
        // this.fullData[this.index]["mark"] = "sentence-mark";
        return [category];
      }
      return category;
    },

    uploadLabel(category) {
      // 标注意图标签
      // var intent = category[category.length - 1];
      var intent = category
      let label = this.earlyUpload(intent);

      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label_ = this.fullData[this.index].label.join("@#$");
      let ner = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label_, ner, tuple);
      // this.fullData[this.index]["mark"] = "sentence-mark";
    },

    uploadNer() {
      // NER无需标注
      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner = "0$0$None@无需标注";
      this.fullData[this.index].ner = {
        None: ["0$0$None@None", "0$0$None@无需标注"]
      };
      let tuple = this.fullData[this.index].tuple.join("@#$");
      this.upload(uuid, filename, label, ner, tuple);
      // this.fullData[this.index]["mark"] = "sentence-mark";
    },

    uploadTuple() {
      // 二元组无需标注
      let uuid = this.fullData[this.index].uuid;
      let filename = this.fullData[this.index].file;
      let label = this.fullData[this.index].label.join("@#$");
      let ner = Object.values(this.fullData[this.index]["ner"])
        .flat(Infinity)
        .slice(1)
        .join("@#$")
        .split(",")
        .join("@#$");
      this.fullData[this.index].tuple = ["无需标注"];
      let tuple = "无需标注";
      this.upload(uuid, filename, label, ner, tuple);
      // this.fullData[this.index]["mark"] = "sentence-mark";
    },

    hiddenSomething() {
      for (var each in this.checkListTF) {
        // console.log(each, each in this.checkList, this.checkList);
        if (this.checkList.indexOf(each) != -1) {
          this.checkListTF[each] = false;
        } else {
          this.checkListTF[each] = true;
        }
      }
      // for (var each in this.checkList) {
      //   this.checkListTF[this.checkList[each]] = false;
      // }
      // this.$forceUpdate();
      // console.log(this.checkList, this.checkListTF);
    },

    clearSessionTmp() {
      this.currentSentenceId = 0;
      this.currentDialogId = 0;
      this.currentRole = "CLIENT";
      this.currentColumn = "";
      this.pre_type = "";
      this.pre_sentence_id = 0;
      this.catchWords = "";
      this.flipSession = this.session[this.index];
    },

    selectSesPage(value) {
      if (value == "上一页") {
        this.index -= 1;
      } else {
        this.index += 1;
      }
      if (this.index < 0) {
        this.index = 0;
      } else if (this.index == this.session.length) {
        this.index = this.session.length - 1;
      }

      this.clearSessionTmp();
    },

    annotatorRow(row) {
      let dialog_id = row.dialog_id;
      let sentence_id = row.sentence_id;
      let file = row.file;

      let action = row.action.join("@#$");
      let intention = row.intention.join("@#$");
      let confirm_entity = row.confirm_entity.join("@#$");
      let unconfirm_entity = row.unconfirm_entity.join("@#$");
      let entity = row.entity.join("@#$");
      let global_topic = row.global_topic.join("@#$");
      let local_topic = row.local_topic.join("@#$");
      let qa = row.qa;

      const url = this.url + "mark/";
      var params = new URLSearchParams();
      params.append("dialog_id", dialog_id);
      params.append("sentence_id", sentence_id);
      params.append("filename", file);

      params.append("action", action);
      params.append("intention", intention);
      params.append("confirm_entity", confirm_entity);
      params.append("unconfirm_entity", unconfirm_entity);
      params.append("entity", entity);
      params.append("global_topic", global_topic);
      params.append("local_topic", local_topic);
      params.append("qa", qa);

      this.$axios({
        method: "POST",
        url: url,
        data: params
      }).then(response => {
        // console.log(response["data"]);
        if (response["data"]["code"] == 200) {
          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1500
          });
        } else {
          this.$message({
            message: response["data"]["content"],
            type: "error",
            duration: 1500
          });
          return;
        }
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
    },

    topic(row) {
      let url = "http://192.168.1.74:8123/notation/v1";
      var local_topic = [];
      var global_topic = [];

      // 第0句
      if (row.sentence_id == 0) {
        // local_topic
        local_topic = row.local_topic;
        // global_topic
        global_topic = row.global_topic;
      } else if (row.sentence_id != this.pre_sentence_id + 1) {
        //跨行标注
        return false;
      } else {
        local_topic = this.flipSession[row.sentence_id - 1].local_topic;
        global_topic = this.flipSession[row.sentence_id - 1].global_topic;
        this.pre_sentence_id += 1;
      }
      console.log(
        "global_topic: ",
        this.flipSession[row.sentence_id].global_topic
      );
      // 实体（NER）预处理
      let tmp_entity = [];
      for (let each in row.entity) {
        var tmp = row.entity[each];
        tmp_entity.push(tmp.replace("#", "：").split("@")[0]);
      }

      this.$axios({
        method: "GET",
        url: url,
        params: {
          sentence: row.sentence,
          entity: tmp_entity.join("，"),
          local_topic: local_topic.join("，"),
          global_topic: global_topic.join("，"),
          pre_type: this.pre_type
        }
      }).then(response => {
        this.pre_type = response["data"]["data"]["pre_type"];
        // 判断返回数据的类型
        // 假设返回[""]，则赋值[]
        // 否则正常接收数据
        if (response["data"]["data"]["local_topic"][0] == "") {
          row.local_topic = [];
        } else {
          row.local_topic = response["data"]["data"]["local_topic"];
        }

        if (response["data"]["data"]["global_topic"][0] == "") {
          row.global_topic = [];
        } else {
          row.global_topic = response["data"]["data"]["global_topic"];
        }
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
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

    annotatorClassification(scope, col, value) {
      let dialog_id = scope.row.dialog_id;
      let sentence_id = scope.row.sentence_id;

      if (this.catchWords == "") {
        this.catchWords = this.flipSession[sentence_id]["sentence"];
      }
      var intent = value[value.length - 1];
      intent = this.catchWords + "#" + intent;
      this.flipSession[sentence_id][col].push(intent);
      this.catchWords = "";
      window.getSelection().removeAllRanges();
      // console.log(scope);
    },

    tagMove(tag, row) {
      this.origin = tag;
      // console.log(tag);
    },

    tagReverse(tag, row) {
      var tagIndex = row.entity.indexOf(tag);

      if (tag.indexOf("否定") == 0) {
        row.entity[tagIndex] = tag.replace("否定", "");
      } else {
        let entity_name = tag.split("#")[0];
        let tagLength = tag.split("#").length;
        let entity = tag.split("#").slice(1, tagLength);
        row.entity[tagIndex] = "否定" + entity_name + "#" + entity.join("#");
      }
      this.annotatorRow(row);
    },

    pasteTag(row, column, cell, event) {
      this.locCurrentSentenceId(row, column, event);
      var col = column["label"];

      // 主题标注
      if (["local_topic", "global_topic"].indexOf(col) != -1) {
        let tf = this.topic(row);
        console.log("tf: ", tf);

        // 判断当前topic标注是否满足标注规范
        if (tf == false) {
          return;
        }
      } else if (["qa"].indexOf(col) != -1) {
        if (row.role == "CLIENT") {
          this.qaSentenceId = row.sentence_id;
        } else {
          if (this.qaSentenceId > -1) {
            console.log("a", row.qa, typeof row.qa);
            let tmp = row.qa.split("#");
            if (tmp[0] == "") {
              row.qa = String(this.qaSentenceId);
            } else {
              tmp.push(String(this.qaSentenceId));
              tmp = this.UniqueArray(tmp);
              row.qa = tmp.join("#");
            }
            console.log(row, row.qa);
            this.annotatorRow(row);
          }
        }
        return;
      } else if (
        [
          "sentence_id",
          "role",
          "sentence",
          "intention",
          "action",
          "entity"
        ].indexOf(col) != -1 ||
        this.origin == ""
      ) {
        return;
      }

      this.flipSession[this.currentSentenceId][col].push(this.origin);
      this.origin = "";
      setTimeout(() => {
        this.annotatorRow(this.flipSession[this.currentSentenceId]);
        return;
      }, 200);
      // console.log('row: ', row, 'col: ', column, 'cell: ', cell, 'event: ', event)
    },

    // 按钮函数
    cqaLabelUpdate(cqa, label) {
      const url = this.url + "mark/";
      var params = new URLSearchParams();
      params.append("uuid", cqa.uuid);
      params.append("question", cqa.question);
      params.append("answer", cqa.answer);
      params.append("context", cqa.context);
      params.append("filename", this.filename);
      params.append("category", label.toString());

      this.$axios({
        method: "POST",
        url: url,
        data: params
      }).then(response => {
        // console.log(response["data"]);
        if (response["data"]["code"] == 200) {
          // 更新标签信息
          this.fullData[cqa.id]["color"] = this.colorMap[label];
          this.fullData[cqa.id]["mark"] = "sentence-mark";
          this.fullData[cqa.id]["label"] = [label];
          // console.log(this.flipCqa);
          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1500
          });
        } else {
          this.$message({
            message: response["data"]["content"],
            type: "error",
            duration: 1500
          });
          return;
        }
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      )
    },

    // 筛选 未标注文件 和 未分配的文件
    remoteMethod(query) {
      this.reqUnMarkFiles(this.mclasseng, query);
    },

    nextDialog(tag) {
      this.fullData[this.pre]["mark"] = "sentence-mark";
      this.graphUpload(tag);
      this.twoRelations[this.flipGraph[0]["dialog_id"]] = [];
      this.twoRelations[this.flipGraph[0]["dialog_id"]].push(tag);
      // console.log(this.fullData[this.pre]);
      this.pre += 1;
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
      // console.log(this.entitiesClickCount, this.status, this.twoEntity);
    },

    findEntityLocation(relation) {
      for (
        var i = 0;
        i < this.twoRelations[this.flipGraph[0]["dialog_id"]].length;
        i++
      ) {
        if (relation == this.twoRelations[this.flipGraph[0]["dialog_id"]][i]) {
          return i;
        }
      }
      return -1;
    },

    relationButtonClick(relation) {
      // 关系点击事件
      var twoEntityLength = this.twoEntity.length;
      console.log(this.tmpRelation, this.twoEntity, relation);
      // if (relation != "问关系" && relation != "条件") {
      //   if (
      //     this.twoEntity[twoEntityLength - 2] ==
      //       this.twoEntity[twoEntityLength - 1] &&
      //     this.twoEntity[twoEntityLength - 1] != "0$0$0$None@None"
      //   ) {
      //     // 如果是单句标注，则取最后一个标签
      //     this.tmpRelation = [this.twoEntity[twoEntityLength - 1], relation];
      //   } else if (this.twoEntity.length == 0) {
      //     console.log("this.twoEntity.length == 0");
      //   } else {
      //     // 如果不是单句标注，则取最后两个标签
      //     this.tmpRelation = [
      //       this.twoEntity[twoEntityLength - 2],
      //       relation,
      //       this.twoEntity[twoEntityLength - 1]
      //     ];
      //   }
      // } else {
      //   this.relation = relation;
      //   // this.tmpRelation.push(relation);
      // }
      if (
          this.twoEntity[twoEntityLength - 2] ==
            this.twoEntity[twoEntityLength - 1] &&
          this.twoEntity[twoEntityLength - 1] != "0$0$0$None@None"
        ) {
          // 如果是单句标注，则取最后一个标签
          this.tmpRelation = [this.twoEntity[twoEntityLength - 1], relation];
        } else if (this.twoEntity.length == 0) {
          console.log("this.twoEntity.length == 0");
        } else {
          // 如果不是单句标注，则取最后两个标签
          this.tmpRelation = [
            this.twoEntity[twoEntityLength - 2],
            relation,
            this.twoEntity[twoEntityLength - 1]
          ];
        }
      // console.log("a", this.tmpRelation);
      if (this.tmpRelation.length == 3 && this.relation != "") {
        this.tmpRelation.push(this.relation);
      }

      // 如果那一段没标过
      if (!(this.flipGraph[0]["dialog_id"] in this.twoRelations)) {
        // 创建一个空的[]
        this.twoRelations[this.flipGraph[0]["dialog_id"]] = [];
      }
      if (
        // 如果标签之前就存在了，则关闭关系标注窗口
        this.twoRelations[this.flipGraph[0]["dialog_id"]].indexOf(
          this.tmpRelation
        ) >= 0
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
        var len = this.twoRelations[this.flipGraph[0]["dialog_id"]].length;
        this.$set(
          this.twoRelations[this.flipGraph[0]["dialog_id"]],
          len,
          this.tmpRelation
        );
        this.$forceUpdate();
        this.twoEntity = [];
        this.graphUpload(this.tmpRelation);
        this.tmpRelation = [];
        this.relation = "";
        this.fullData[this.pre]["mark"] = "sentence-mark";
        this.entitiesClickCount = 0;
        this.status = true;
      }
    },

    changeEntityLocation(relation) {
      // 鼠标左键单击改变实体的左右位置
      // let idx = this.findEntityLocation(relation);
      let idx = this.twoRelations[this.flipGraph[0]["dialog_id"]].indexOf(
        relation
      );
      // console.log("改变前整个：", idx, relation, this.twoRelations[this.flipGraph[0]["dialog_id"]])
      // console.log('改变前:', this.twoRelations[this.flipGraph[0]["dialog_id"]][idx])
      this.$set(
        this.twoRelations[this.flipGraph[0].dialog_id],
        idx,
        this.twoRelations[this.flipGraph[0]["dialog_id"]][idx]
          .split("#")
          .reverse()
          .join("#")
      );
      this.$forceUpdate();
      // console.log('改变后:', this.twoRelations[this.flipGraph[0]["dialog_id"]][idx])
      this.graphUpload(this.twoRelations[this.flipGraph[0]["dialog_id"]][idx]);
      // console.log(this.twoRelations[this.flipGraph[0].dialog_id])
    },

    judgeLabelIsEmpty() {
      // 关系标注的数量
      let relationNum =
        this.twoRelations[this.flipGraph[0]["dialog_id"]] == undefined
          ? 0
          : this.twoRelations[this.flipGraph[0]["dialog_id"]].length;
      let nerNum = 0;
      let values =
        this.onlineNERS[this.flipGraph[0]["dialog_id"]] == undefined
          ? 0
          : Object.values(this.onlineNERS[this.flipGraph[0]["dialog_id"]]);

      for (let value in values) {
        nerNum += value.length;
      }
      if (relationNum == 0 && nerNum == 0) {
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
        let idx = this.onlineNERS[this.flipGraph[0]["dialog_id"]][
          entity_name
        ].indexOf(ner);
        let deletedNer = this.onlineNERS[this.flipGraph[0]["dialog_id"]][
          entity_name
        ].splice(idx, 1);

        console.log("删除NER", deletedNer);
        // 判断是否未空字典
        if (
          this.onlineNERS[this.flipGraph[0]["dialog_id"]][entity_name].length ==
          0
        ) {
          delete this.onlineNERS[this.flipGraph[0]["dialog_id"]][entity_name];
        }
        // 发送删除请求
        const url = this.url + "mark/";
        var params = new URLSearchParams();
        this.graphUpload(ner, "delete");
        // if (this.judgeLabelIsEmpty() == false) {
        //   this.fullData[this.pre]["mark"] = "sentence-no-mark";
        // }
        console.log(this.onlineNERS[this.flipGraph[0]["dialog_id"]]);
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
          this.flipGraph[0]["dialog_id"]
        ].splice(idx, 1);
        console.log("删除关系", deletedRelation);
        // 发送删除请求
        const url = this.url + "mark/";
        var params = new URLSearchParams();
        this.graphUpload(relation, "delete");

        if (this.judgeLabelIsEmpty() == false) {
          this.fullData[this.pre]["mark"] = "sentence-no-mark";
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
        var dialog_id = this.flipGraph[0]["dialog_id"];
        var filename = this.filename;

        console.log(
          "删除所有标签",
          this.twoRelations[this.flipGraph[0]["dialog_id"]]
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
        }).then(res => {
          // console.log(res["data"]["data"]);
          if (res["data"]["code"] == 200) {
            this.$message({
              type: "success",
              message: "删除成功"
            });
            console.log(this.judgeLabelIsEmpty() == false, this.pre);
            if (this.judgeLabelIsEmpty() == false) {
              this.fullData[this.pre]["mark"] = "sentence-no-mark";
            }
            this.$forceUpdate();
          }
        }).catch(error =>
          this.$alert('接口异常', '错误', {
            confirmButtonText: '确定',
            type: 'error'
          })
        );
      });
    },

    graphUpload(relation, del) {
      const url = this.url + "mark/";
      var params = new URLSearchParams();

      // file dialog_id label
      params.append("filename", this.filename);
      params.append("dialog_id", this.flipGraph[0].dialog_id);
      params.append("entity_value_relationship", relation);
      params.append("early_entity_value_relationship", "");
      params.append("delete", del);

      this.$axios({
        method: "POST",
        url: url,
        data: params
      }).then(response => {
        if (response["data"]["code"] == 200) {
          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1000
          });
        } else if (response["data"]["code"] == 201) {
          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1000
          });
          return;
        } else {
          this.$message({
            message: response["data"]["content"],
            type: "error",
            duration: 1000
          });
          return;
        }
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
    },

    // classification按钮函数
    upload(uuid, filename, label, ner, tuple) {
      if (this.fullData[this.index].sentence == "") {
        this.$message({
          message: "data error",
          type: "error",
          duration: 1500
        });
        return;
      }

      // 修改标签统计方式
      this.intentionDataStatusChineseToEng()
      this.intentionSingleDataStatusChange(this.intentionDataStatusEng, this.index)

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
      }).then(response => {
        if (response["data"]["code"] == 200) {
          this.$message({
            message: response["data"]["content"],
            type: "success",
            duration: 1000
          });
          // 自动翻页
          // if (category == "无") {
          this.index += 1;
          // }
        } else if (response["data"]["code"] == 201) {
          // 添加/更新当前session标注list
          // this.$set(this.marked_process, this.index, category.split("、"));

          this.$message({
            message: response["data"]["content"],
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
      }).catch(error =>
        this.$alert('接口异常', '错误', {
          confirmButtonText: '确定',
          type: 'error'
        })
      );
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.left {
  background-color: white;
  width: calc(100% - 300px);
  padding-left: 40px;
  padding-right: 20px;
  padding-top: 40px;
}
.right {
  width: 380px;
  background-color: white;
  border-left: thick solid #b5b5b5;
  border-left-width: 10px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 32px;
}

.graph {
  height: calc(100% - 126px);
  position: relative;
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  border-radius: 5px;
  width: calc(98% - 20px);
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  min-height: 120px;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
  display: flex;
}

.graph .show-dialogs {
  width: 48%;
}

.graph .show-entities {
  width: calc(52% - 260px);
  margin: 5px;
}

.graph .show-entities-relation {
  width: 260px;
  margin: 5px;
  overflow-y: scroll;
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

.classification {
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
.labeled {
  display: flex;
  flex-direction: row;
  color: #4799fc;
  font-size: 20px;
  left: 5px;
  bottom: 5px;
  /* flex: bottom; */
}

.button-new-tag {
  margin-bottom: 2px;
}

.cqa {
  position: relative;
  height: calc(100% - 196px);
  border: 1px solid rgb(218, 218, 218);
  font-size: 18px;
  color: rgb(44, 46, 46);
  border-radius: 5px;
  width: calc(98%);
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
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
  color: white;
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
  &:hover,
  &:focus {
    background: transparent;
  }
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

.search-result {
  height: calc(100% - 150px);
  border: 1px solid rgb(218, 218, 218);
  overflow-y: scroll;
  border-radius: 5px;
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

.col-tag {
  margin: 2px;
}

.color-border-A {
  border: 1px solid rgb(214, 39, 40);
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

.color-K {
  color: rgb(238, 22, 209);
}

.color-L {
  color: rgb(128, 17, 113);
}

.color-M {
  color: rgb(73, 5, 64);
}

.color-N {
  color: rgb(68, 59, 150);
}
.color-O {
  color: rgb(27, 131, 79);
}
.color-P {
  color: rgb(175, 154, 62);
}
.color-Q {
  color: rgb(122, 145, 40);
}
.color-R {
  color: rgb(133, 60, 60);
}
.color-S {
  color: rgb(139, 221, 143);
}
.color-T {
  color: rgb(170, 172, 95);
}

.div-btn {
  margin-right: 10px;
  margin-bottom: 10px;
}

.upload {
  vertical-align: top;
  max-width: 35%;
  max-height: 100px;
  padding-left: 10px;
  padding-right: 10px;
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
  position: absolute;
  color: #4799fc;
  float: right;
  right: 5px;
  bottom: 5px;
  /* flex: bottom; */
}
</style>

<style>
/* .inputBackground{
    background:cyan;
  } */
.el-button + .el-button {
  margin-left: 0px;
}

.el-cascader-menu {
  height: 320px;
}

.el-button--medium {
  height: 40px;
}

.el-scrollbar__wrap {
  overflow-x: hidden;
}

.cqa .el-textarea__inner {
  border-radius: 0px;
}

.el-textarea.is-disabled .el-textarea__inner {
  color: rgb(102, 97, 97);
}

/*滚动条样式*/
::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 4px;
}
::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #e0e5eb;
}
::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  /*-webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);*/
  border-radius: 0;
  /*background: rgba(0,0,0,0.1);*/
}
</style>
