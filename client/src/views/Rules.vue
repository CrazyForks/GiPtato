<template>
  <div class="rules-container">
    <div class="page-header">
      <h1>防火墙规则管理</h1>
      <div>
        <el-button type="primary" @click="$router.push('/servers')">返回服务器列表</el-button>
        <el-button type="success" @click="deployIptato" :loading="deploying">部署脚本</el-button>
      </div>
    </div>

    <div v-if="server" class="server-info">
      <h2>{{ server.name }} <el-tag :type="server.status === 'online' ? 'success' : 'danger'">{{ server.status === 'online' ? '在线' : '离线' }}</el-tag></h2>
      <p>{{ server.host }}:{{ server.port }} ({{ server.username }})</p>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="出网控制" name="outbound">
        <el-card>
          <div slot="header">
            <span>封禁管理</span>
          </div>
          <el-button-group>
            <el-button type="primary" @click="blockBTPT" :loading="loading">封禁BT/PT</el-button>
            <el-button type="primary" @click="blockSPAM" :loading="loading">封禁SPAM</el-button>
            <el-button type="primary" @click="blockAll" :loading="loading">封禁全部</el-button>
          </el-button-group>
          
          <el-divider></el-divider>
          
          <el-form :inline="true" @submit.native.prevent="blockCustomPorts">
            <el-form-item label="自定义端口">
              <el-input v-model="customPorts" placeholder="如: 6881,6882-6889"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="warning" @click="blockCustomPorts" :loading="loading">封禁</el-button>
            </el-form-item>
          </el-form>
          
          <el-form :inline="true" @submit.native.prevent="blockCustomKeyword">
            <el-form-item label="自定义关键词">
              <el-input v-model="customKeyword" placeholder="如: youtube.com"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="warning" @click="blockCustomKeyword" :loading="loading">封禁</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>解封管理</span>
          </div>
          <el-button-group>
            <el-button type="success" @click="unblockBTPT" :loading="loading">解封BT/PT</el-button>
            <el-button type="success" @click="unblockSPAM" :loading="loading">解封SPAM</el-button>
            <el-button type="success" @click="unblockAll" :loading="loading">解封全部</el-button>
          </el-button-group>
          
          <el-divider></el-divider>
          
          <el-form :inline="true" @submit.native.prevent="unblockCustomPorts">
            <el-form-item label="自定义端口">
              <el-input v-model="customUnblockPorts" placeholder="如: 6881,6882-6889"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="unblockCustomPorts" :loading="loading">解封</el-button>
            </el-form-item>
          </el-form>
          
          <el-form :inline="true" @submit.native.prevent="unblockCustomKeyword">
            <el-form-item label="自定义关键词">
              <el-input v-model="customUnblockKeyword" placeholder="如: youtube.com"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="unblockCustomKeyword" :loading="loading">解封</el-button>
            </el-form-item>
          </el-form>
          
          <el-button type="success" @click="unblockAllKeywords" :loading="loading">解封所有关键词</el-button>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="入网控制" name="inbound">
        <el-card>
          <div slot="header">
            <span>入网端口管理</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshInboundPorts">刷新</el-button>
          </div>
          
          <el-table v-loading="loadingPorts" :data="inboundPorts" style="width: 100%">
            <el-table-column prop="port" label="端口" width="180"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button type="danger" size="mini" @click="disallowPort(scope.row.port)">取消放行</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-divider></el-divider>
          
          <el-form :inline="true" @submit.native.prevent="allowPort">
            <el-form-item label="放行端口">
              <el-input v-model="portToAllow" placeholder="如: 80,443"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="allowPort" :loading="loading">添加</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>入网IP管理</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshInboundIPs">刷新</el-button>
          </div>
          
          <el-table v-loading="loadingIPs" :data="inboundIPs" style="width: 100%">
            <el-table-column prop="ip" label="IP地址" width="180"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button type="danger" size="mini" @click="disallowIP(scope.row.ip)">取消放行</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-divider></el-divider>
          
          <el-form :inline="true" @submit.native.prevent="allowIP">
            <el-form-item label="放行IP">
              <el-input v-model="ipToAllow" placeholder="如: 192.168.1.1"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="allowIP" :loading="loading">添加</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="状态查看" name="status">
        <el-card>
          <div slot="header">
            <span>当前封禁列表</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshBlockList">刷新</el-button>
          </div>
          
          <pre v-if="blockList" class="output">{{ blockList }}</pre>
          <div v-else>加载中...</div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>SSH端口状态</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshSSHPort">刷新</el-button>
          </div>
          
          <pre v-if="sshPortStatus" class="output">{{ sshPortStatus }}</pre>
          <div v-else>加载中...</div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <div slot="header">
            <span>重置</span>
          </div>
          
          <el-button type="danger" @click="confirmClearRules">清空所有规则</el-button>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-card v-if="commandOutput" style="margin-top: 20px">
      <div slot="header">
        <span>命令输出</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="clearCommandOutput">清空</el-button>
      </div>
      <pre :class="['output', {'output-error': commandOutput.includes('失败') || commandOutput.includes('错误')}]">{{ commandOutput }}</pre>
      
      <div v-if="commandOutput.includes('status code 500')" class="error-solution">
        <el-alert
          title="发现服务器内部错误(500)"
          type="error"
          description="服务器内部错误可能由多种原因导致，建议尝试以下解决方案："
          show-icon
          :closable="false">
        </el-alert>
        <el-collapse style="margin-top: 10px;">
          <el-collapse-item title="可能的解决方案" name="1">
            <ol>
              <li>检查服务器连接状态，确保SSH可以正常连接</li>
              <li>尝试手动部署脚本按钮，绕过自动部署流程</li>
              <li>检查服务器磁盘空间是否足够</li>
              <li>查看服务器日志文件 (/var/log/syslog 或 /var/log/messages)</li>
              <li>尝试在服务器上手动执行以下命令:</li>
              <pre class="command-example">wget -N --no-check-certificate https://raw.githubusercontent.com/Fiftonb/GiPtato/refs/heads/main/iPtato.sh && chmod +x iPtato.sh && bash iPtato.sh</pre>
              <li>如仍无法解决，请联系管理员或提交详细错误报告</li>
            </ol>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>

    <el-card v-if="!isInitialized" class="initialization-card">
      <div slot="header">
        <span>初始化检查</span>
      </div>
      <el-steps :active="initStepActive" finish-status="success">
        <el-step v-for="(step, index) in initializationSteps" :key="index" :title="step.name"></el-step>
      </el-steps>
      <div class="initialization-actions" style="margin-top: 20px;">
        <el-button v-if="initStepActive === 1" type="primary" @click="connectServer" :loading="connecting">连接服务器</el-button>
        <el-button v-if="initStepActive === 2" type="primary" @click="checkInitialization" :loading="deploying">自动部署脚本</el-button>
        <el-button v-if="initStepActive === 2" type="warning" @click="deployIptatoManually" :loading="deploying">手动部署脚本</el-button>
        <el-button v-if="initStepActive === 3" type="primary" @click="completeInitialization">加载规则</el-button>
        <el-button type="danger" @click="manualInitialize" :loading="loading">跳过检查直接初始化</el-button>
      </div>
      <div v-if="commandOutput && commandOutput.includes('脚本部署失败')" class="error-info" style="margin-top: 15px; color: #F56C6C;">
        <p>部署失败原因可能包括：</p>
        <ul>
          <li>服务器连接不稳定</li>
          <li>服务器配置问题</li>
          <li>网络限制阻止了脚本下载</li>
        </ul>
        <p>建议尝试：</p>
        <ul>
          <li>点击"手动部署脚本"按钮</li>
          <li>检查服务器连接状态</li>
          <li>查看服务器日志获取详细信息</li>
        </ul>
      </div>
    </el-card>

    <el-card style="margin-top: 20px;">
      <div slot="header">
        <span>调试工具</span>
      </div>
      <el-button type="warning" @click="checkScriptExistence" :loading="debugging">检查脚本存在</el-button>
      <el-button type="warning" @click="testServerConnection" :loading="debugging">测试服务器连接</el-button>
      <el-button type="danger" @click="resetConnectionState" :loading="debugging">重置连接状态</el-button>
      
      <div v-if="debugInfo" class="debug-info" style="margin-top: 15px;">
        <h4>调试信息：</h4>
        <pre>{{ debugInfo }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'RulesView',
  props: {
    serverId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'outbound',
      loading: false,
      deploying: false,
      connecting: false,
      loadingPorts: false,
      loadingIPs: false,
      server: null,
      blockList: '',
      sshPortStatus: '',
      inboundPorts: [],
      inboundIPs: [],
      commandOutput: '',
      customPorts: '',
      customKeyword: '',
      customUnblockPorts: '',
      customUnblockKeyword: '',
      portToAllow: '',
      ipToAllow: '',
      isInitialized: false,
      initStepActive: 0,
      initializationSteps: [
        { name: '检查状态', done: false },
        { name: '连接服务器', done: false },
        { name: '部署脚本', done: false },
        { name: '加载规则', done: false }
      ],
      debugging: false,
      debugInfo: ''
    };
  },
  computed: {
    ...mapGetters('servers', ['getLoading']),
    hasValidServerId() {
      return !!this.serverId && this.serverId !== 'undefined';
    }
  },
  beforeRouteEnter(to, from, next) {
    // 检查路由参数中是否包含有效的服务器ID
    if (!to.params.serverId) {
      // 如果没有有效的服务器ID，重定向到服务器列表页面
      next(vm => {
        vm.$message.error('未指定服务器ID，请先选择服务器');
        vm.$router.push('/servers');
      });
    } else {
      next();
    }
  },
  async created() {
    if (this.hasValidServerId) {
      await this.checkInitialization();
    } else {
      this.commandOutput = '服务器ID无效，请返回服务器列表重新选择服务器';
      this.$message.error('服务器ID无效');
    }
  },
  methods: {
    ...mapActions('servers', [
      'getServer',
      'deployIptato',
      'connectServer'
    ]),
    ...mapActions('rules', [
      'getBlockList',
      'blockBTPTAction',
      'blockSPAMAction',
      'blockAllAction',
      'blockCustomPortsAction',
      'blockCustomKeywordAction',
      'unblockBTPTAction',
      'unblockSPAMAction',
      'unblockAllAction',
      'unblockCustomPortsAction',
      'unblockCustomKeywordAction',
      'unblockAllKeywordsAction',
      'getInboundPorts',
      'getInboundIPs',
      'allowInboundPortsAction',
      'disallowInboundPortsAction',
      'allowInboundIPsAction',
      'disallowInboundIPsAction',
      'getSSHPort',
      'clearAllRulesAction'
    ]),
    async checkInitialization() {
      try {
        if (!this.hasValidServerId) {
          this.commandOutput = '错误：未指定服务器ID，请返回服务器列表选择服务器';
          this.$message.error('未指定服务器ID');
          return false;
        }

        // 重置初始化步骤
        this.resetInitSteps();
        this.isInitialized = false;
        this.initStepActive = 0;
        
        // 步骤1: 检查状态
        this.loading = true;
        const serverResponse = await this.getServer(this.serverId);
        if (!serverResponse || !serverResponse.success) {
          throw new Error(serverResponse?.error || '获取服务器信息失败');
        }
        this.server = serverResponse.data;
        this.initializationSteps[0].done = true;
        this.initStepActive = 1;
        
        // 步骤2: 连接服务器
        if (!this.server.status || this.server.status !== 'connected') {
          this.commandOutput = '正在连接服务器...';
          this.connecting = true;
          const connectResponse = await this.connectServer(this.serverId);
          this.connecting = false;
          
          if (!connectResponse || !connectResponse.success) {
            throw new Error(connectResponse?.error || '连接服务器失败');
          }
          this.commandOutput += '\n服务器连接成功';
        }
        this.initializationSteps[1].done = true;
        this.initStepActive = 2;
        
        // 步骤3: 部署脚本
        this.commandOutput += '\n检查iptato脚本部署情况...';
        this.deploying = true;
        try {
          const deployResponse = await this.deployIptato(this.serverId);
          this.deploying = false;
          
          if (!deployResponse || !deployResponse.success) {
            const errorMsg = deployResponse?.error || '脚本部署失败';
            this.commandOutput += `\n脚本部署失败: ${errorMsg}`;
            
            // 检查是否是服务器内部错误
            if (errorMsg.includes('500') || errorMsg.includes('内部错误')) {
              this.commandOutput += '\n服务器内部错误，可能原因：';
              this.commandOutput += '\n1. 服务器磁盘空间不足';
              this.commandOutput += '\n2. 服务器防火墙限制了文件上传';
              this.commandOutput += '\n3. 服务器缺少必要的依赖包';
              this.commandOutput += '\n\n建议操作：';
              this.commandOutput += '\n- 检查服务器连接状态';
              this.commandOutput += '\n- 查看服务器日志获取详细错误信息';
              this.commandOutput += '\n- 尝试手动连接服务器并安装依赖';
            }
            
            this.$message.error(`脚本部署失败: ${errorMsg}`);
            throw new Error(errorMsg);
          }
          
          this.commandOutput += '\n脚本部署成功';
          this.initializationSteps[2].done = true;
          this.initStepActive = 3;
        } catch (deployError) {
          this.deploying = false;
          this.commandOutput += `\n脚本部署过程中出错: ${deployError.message}`;
          throw deployError;
        }
        
        // 步骤4: 加载规则
        await this.refreshBlockList();
        await this.refreshSSHPort();
        await this.refreshInboundPorts();
        await this.refreshInboundIPs();
        
        this.initializationSteps[3].done = true;
        this.isInitialized = true;
        this.loading = false;
        return true;
      } catch (error) {
        this.loading = false;
        this.deploying = false;
        this.connecting = false;
        this.commandOutput += `\n初始化失败: ${error.message}`;
        this.$message.error(`初始化失败: ${error.message}`);
        return false;
      }
    },
    resetInitSteps() {
      this.initializationSteps.forEach(step => step.done = false);
    },
    async refreshBlockList() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法获取阻止列表');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.getBlockList(this.serverId);
        
        if (response && response.success) {
          this.blockList = response.data || '无阻止列表数据';
        } else {
          this.$message.warning(response?.error || '获取阻止列表失败');
          this.blockList = '获取阻止列表失败';
        }
      } catch (error) {
        this.$message.error(`获取阻止列表错误: ${error.message}`);
        this.blockList = `获取失败: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    async refreshSSHPort() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法获取SSH端口');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.getSSHPort(this.serverId);
        
        if (response && response.success) {
          this.sshPortStatus = response.data || '无SSH端口数据';
        } else {
          this.$message.warning(response?.error || '获取SSH端口失败');
          this.sshPortStatus = '获取SSH端口失败';
        }
      } catch (error) {
        this.$message.error(`获取SSH端口错误: ${error.message}`);
        this.sshPortStatus = `获取失败: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    async refreshInboundPorts() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法获取入网端口');
        return;
      }
      
      try {
        this.loadingPorts = true;
        const response = await this.getInboundPorts(this.serverId);
        
        if (response && response.success) {
          this.inboundPorts = response.data || [];
        } else {
          this.$message.warning(response?.error || '获取入网端口失败');
          this.inboundPorts = [];
        }
      } catch (error) {
        this.$message.error(`获取入网端口错误: ${error.message}`);
        this.inboundPorts = [];
      } finally {
        this.loadingPorts = false;
      }
    },
    async refreshInboundIPs() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法获取入网IP');
        return;
      }
      
      try {
        this.loadingIPs = true;
        const response = await this.getInboundIPs(this.serverId);
        
        if (!response || !response.success) {
          // 检查特定错误类型
          if (response && response.error && response.error.includes('连接')) {
            this.$message.error('服务器连接失败，请检查连接设置');
            // 重置初始化状态
            this.resetInitSteps();
            this.isInitialized = false;
          } else if (response && response.error && response.error.includes('脚本')) {
            this.$message.error('脚本部署失败，请重新初始化');
            this.resetInitSteps();
            this.isInitialized = false;
          } else {
            this.$message.warning(response?.error || '获取入网IP失败');
          }
          this.inboundIPs = [];
          this.commandOutput = `获取入网IP失败: ${response?.error || '未知错误'}`;
          return;
        }
        
        const ipData = response.data || '';
        try {
          // 尝试解析不同格式的IP数据
          if (Array.isArray(ipData)) {
            this.inboundIPs = ipData;
          } else if (typeof ipData === 'string') {
            // 尝试解析字符串形式的IP列表
            if (ipData.trim() === '') {
              this.inboundIPs = [];
            } else {
              // 尝试解析多种可能的格式
              const lines = ipData.split('\n').filter(line => line.trim() !== '');
              this.inboundIPs = lines.map(line => {
                // 尝试提取IP地址
                const ipMatch = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
                return ipMatch ? ipMatch[0] : line.trim();
              }).filter(ip => ip);
            }
          } else {
            this.inboundIPs = [];
            this.$message.warning('IP数据格式无法识别');
          }
          this.commandOutput = '获取入网IP成功';
        } catch (parseError) {
          this.$message.warning(`解析IP数据出错: ${parseError.message}`);
          this.inboundIPs = [];
          this.commandOutput = `解析IP数据出错: ${parseError.message}`;
        }
      } catch (error) {
        this.$message.error(`获取入网IP错误: ${error.message}`);
        this.inboundIPs = [];
        this.commandOutput = `获取入网IP错误: ${error.message}`;
      } finally {
        this.loadingIPs = false;
      }
    },
    async executeTestCommand() {
      if (!this.hasValidServerId) {
        this.commandOutput = '错误：未指定服务器ID，无法执行命令';
        this.$message.error('未指定服务器ID');
        return;
      }
      
      // 其他代码不变...
    },
    async blockBTPT() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.blockBTPTAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功阻止BT/PT流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '阻止BT/PT失败');
        }
      } catch (error) {
        this.$message.error(`阻止BT/PT错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async blockSPAM() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.blockSPAMAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功阻止垃圾邮件流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '阻止垃圾邮件失败');
        }
      } catch (error) {
        this.$message.error(`阻止垃圾邮件错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async blockAll() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.blockAllAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功阻止所有流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '阻止所有流量失败');
        }
      } catch (error) {
        this.$message.error(`阻止所有流量错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async blockCustomPorts() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行阻止操作');
        return;
      }
      
      if (!this.customPorts) {
        this.$message.warning('请输入要阻止的端口');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.blockCustomPortsAction({
          serverId: this.serverId,
          ports: this.customPorts
        });
        
        if (response && response.success) {
          this.$message.success(`成功阻止端口: ${this.customPorts}`);
          this.customPorts = '';
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '阻止自定义端口失败');
        }
      } catch (error) {
        this.$message.error(`阻止自定义端口错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async blockCustomKeyword() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行阻止操作');
        return;
      }
      
      if (!this.customKeyword) {
        this.$message.warning('请输入要阻止的关键词');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.blockCustomKeywordAction({
          serverId: this.serverId,
          keyword: this.customKeyword
        });
        
        if (response && response.success) {
          this.$message.success(`成功阻止关键词: ${this.customKeyword}`);
          this.customKeyword = '';
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '阻止自定义关键词失败');
        }
      } catch (error) {
        this.$message.error(`阻止自定义关键词错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockBTPT() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockBTPTAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功取消阻止BT/PT流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止BT/PT失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止BT/PT错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockSPAM() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockSPAMAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功取消阻止垃圾邮件流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止垃圾邮件失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止垃圾邮件错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockAll() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockAllAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功取消阻止所有流量');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止所有流量失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止所有流量错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockCustomPorts() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      if (!this.customUnblockPorts) {
        this.$message.warning('请输入要取消阻止的端口');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockCustomPortsAction({
          serverId: this.serverId,
          ports: this.customUnblockPorts
        });
        
        if (response && response.success) {
          this.$message.success(`成功取消阻止端口: ${this.customUnblockPorts}`);
          this.customUnblockPorts = '';
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止自定义端口失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止自定义端口错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockCustomKeyword() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      if (!this.customUnblockKeyword) {
        this.$message.warning('请输入要取消阻止的关键词');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockCustomKeywordAction({
          serverId: this.serverId,
          keyword: this.customUnblockKeyword
        });
        
        if (response && response.success) {
          this.$message.success(`成功取消阻止关键词: ${this.customUnblockKeyword}`);
          this.customUnblockKeyword = '';
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止自定义关键词失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止自定义关键词错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async unblockAllKeywords() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行取消阻止操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.unblockAllKeywordsAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功取消阻止所有关键词');
          await this.refreshBlockList();
        } else {
          this.$message.error(response?.error || '取消阻止所有关键词失败');
        }
      } catch (error) {
        this.$message.error(`取消阻止所有关键词错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async allowPort() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行允许入网操作');
        return;
      }
      
      if (!this.portToAllow) {
        this.$message.warning('请输入要允许的端口');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.allowInboundPortsAction({
          serverId: this.serverId,
          ports: this.portToAllow
        });
        
        if (response && response.success) {
          this.$message.success(`成功允许入网端口: ${this.portToAllow}`);
          this.portToAllow = '';
          await this.refreshInboundPorts();
        } else {
          this.$message.error(response?.error || '允许入网端口失败');
        }
      } catch (error) {
        this.$message.error(`允许入网端口错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async disallowPort(port) {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行禁止入网操作');
        return;
      }
      
      if (!port) {
        this.$message.warning('请指定要禁止的端口');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.disallowInboundPortsAction({
          serverId: this.serverId,
          ports: port
        });
        
        if (response && response.success) {
          this.$message.success(`成功禁止入网端口: ${port}`);
          await this.refreshInboundPorts();
        } else {
          this.$message.error(response?.error || '禁止入网端口失败');
        }
      } catch (error) {
        this.$message.error(`禁止入网端口错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async allowIP() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行允许入网操作');
        return;
      }
      
      if (!this.ipToAllow) {
        this.$message.warning('请输入要允许的IP地址');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.allowInboundIPsAction({
          serverId: this.serverId,
          ips: this.ipToAllow
        });
        
        if (response && response.success) {
          this.$message.success(`成功允许入网IP: ${this.ipToAllow}`);
          this.ipToAllow = '';
          await this.refreshInboundIPs();
        } else {
          this.$message.error(response?.error || '允许入网IP失败');
        }
      } catch (error) {
        this.$message.error(`允许入网IP错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async disallowIP(ip) {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行禁止入网操作');
        return;
      }
      
      if (!ip) {
        this.$message.warning('请指定要禁止的IP地址');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.disallowInboundIPsAction({
          serverId: this.serverId,
          ips: ip
        });
        
        if (response && response.success) {
          this.$message.success(`成功禁止入网IP: ${ip}`);
          await this.refreshInboundIPs();
        } else {
          this.$message.error(response?.error || '禁止入网IP失败');
        }
      } catch (error) {
        this.$message.error(`禁止入网IP错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    confirmClearRules() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行清除规则操作');
        return;
      }
      
      this.$confirm('此操作将清空所有防火墙规则，是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.clearAllRules();
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消清空操作'
        });          
      });
    },
    async clearAllRules() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行清除规则操作');
        return;
      }
      
      try {
        this.loading = true;
        const response = await this.clearAllRulesAction(this.serverId);
        
        if (response && response.success) {
          this.$message.success('成功清除所有规则');
          await this.refreshBlockList();
          await this.refreshInboundPorts();
          await this.refreshInboundIPs();
        } else {
          this.$message.error(response?.error || '清除所有规则失败');
        }
      } catch (error) {
        this.$message.error(`清除所有规则错误: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async deployIptatoManually() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法执行部署操作');
        return;
      }
      
      try {
        this.deploying = true;
        this.commandOutput = '正在尝试手动部署脚本...\n';
        
        // 尝试使用不同的方法部署脚本
        const response = await this.$store.dispatch('servers/executeCommand', {
          serverId: this.serverId,
          command: 'wget -N --no-check-certificate https://raw.githubusercontent.com/Fiftonb/GiPtato/refs/heads/main/iPtato.sh && chmod +x iPtato.sh && bash iPtato.sh'
        });
        
        if (response && response.success) {
          this.commandOutput += '手动部署命令执行成功，正在验证安装结果...\n';
          
          // 验证脚本是否安装成功
          const verifyResponse = await this.$store.dispatch('servers/executeCommand', {
            serverId: this.serverId,
            command: 'test -f /root/iptato.sh && echo "installed" || echo "not found"'
          });
          
          if (verifyResponse && verifyResponse.success && 
              verifyResponse.data && verifyResponse.data.stdout && 
              verifyResponse.data.stdout.includes('installed')) {
            
            this.commandOutput += '脚本已成功安装!\n';
            this.$message.success('脚本手动部署成功');
            this.initializationSteps[2].done = true;
            this.initStepActive = 3;
            
            // 继续初始化流程
            await this.refreshBlockList();
            await this.refreshSSHPort();
            await this.refreshInboundPorts();
            await this.refreshInboundIPs();
            
            this.initializationSteps[3].done = true;
            this.isInitialized = true;
          } else {
            this.commandOutput += '脚本安装验证失败，请检查服务器环境或联系管理员\n';
            this.$message.error('脚本安装验证失败');
          }
        } else {
          this.commandOutput += `手动部署失败: ${response?.error || '未知错误'}\n`;
          this.$message.error('手动部署失败');
        }
      } catch (error) {
        this.commandOutput += `手动部署出错: ${error.message}\n`;
        this.$message.error(`手动部署出错: ${error.message}`);
      } finally {
        this.deploying = false;
      }
    },
    async completeInitialization() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法完成初始化');
        return;
      }
      
      try {
        this.loading = true;
        this.commandOutput = '正在加载规则信息...\n';
        
        // 刷新各种规则状态
        await this.refreshBlockList();
        await this.refreshSSHPort();
        await this.refreshInboundPorts();
        await this.refreshInboundIPs();
        
        // 完成初始化
        this.initializationSteps[3].done = true;
        this.isInitialized = true;
        this.$message.success('初始化完成');
        this.commandOutput += '初始化完成，可以开始管理防火墙规则';
      } catch (error) {
        this.commandOutput += `\n初始化过程中加载规则出错: ${error.message}`;
        this.$message.error(`加载规则失败: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    clearCommandOutput() {
      this.commandOutput = '';
    },
    async checkScriptExistence() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法检查脚本');
        return;
      }
      
      try {
        this.debugging = true;
        this.debugInfo = '正在检查脚本存在状态...\n';
        
        // 使用不同的命令检查脚本是否存在
        const commands = [
          'ls -la /root/iPtato.sh',
          'ls -la /root/iptato.sh',
          'find /root -name "*.sh" | grep -i iptato',
          'find / -name "*.sh" -type f -not -path "*/\\.*" | grep -i iptato 2>/dev/null'
        ];
        
        for (const command of commands) {
          this.debugInfo += `\n执行命令: ${command}\n`;
          const response = await this.$store.dispatch('servers/executeCommand', {
            serverId: this.serverId,
            command
          });
          
          if (response && response.success) {
            const stdout = response.data?.stdout || '';
            const stderr = response.data?.stderr || '';
            
            this.debugInfo += `输出:\n${stdout}\n`;
            if (stderr) {
              this.debugInfo += `错误:\n${stderr}\n`;
            }
            
            if (stdout && (stdout.includes('iPtato.sh') || stdout.includes('iptato.sh'))) {
              this.debugInfo += '\n检测到脚本存在！但前端应用未能识别。\n';
              this.debugInfo += '这可能是脚本命名不一致或路径不同导致的问题。\n';
              this.$message.warning('脚本已存在但应用无法识别，请参考调试信息');
              break;
            }
          } else {
            this.debugInfo += `命令执行失败: ${response?.error || '未知错误'}\n`;
          }
        }
        
        // 检查是否可以执行脚本
        this.debugInfo += '\n尝试直接执行脚本...\n';
        const execResponse = await this.$store.dispatch('servers/executeCommand', {
          serverId: this.serverId,
          command: 'cd /root && (./iPtato.sh --help || ./iptato.sh --help || echo "无法执行脚本")'
        });
        
        if (execResponse && execResponse.success) {
          const stdout = execResponse.data?.stdout || '';
          this.debugInfo += `执行脚本输出:\n${stdout}\n`;
          
          if (stdout.includes('管理脚本') || stdout.includes('iptables')) {
            this.debugInfo += '\n脚本可以成功执行！\n';
            this.debugInfo += '建议使用手动初始化功能完成后续步骤。\n';
            this.$message.success('脚本可以成功执行，但需要手动初始化');
          }
        } else {
          this.debugInfo += `脚本执行失败: ${execResponse?.error || '未知错误'}\n`;
        }
      } catch (error) {
        this.debugInfo += `\n检查过程出错: ${error.message}\n`;
        this.$message.error(`检查出错: ${error.message}`);
      } finally {
        this.debugging = false;
      }
    },
    async testServerConnection() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法测试连接');
        return;
      }
      
      try {
        this.debugging = true;
        this.debugInfo = '正在测试服务器连接...\n';
        
        // 基本连接测试
        this.debugInfo += '1. 检查服务器信息:\n';
        const serverResponse = await this.getServer(this.serverId);
        if (serverResponse && serverResponse.success) {
          this.debugInfo += `服务器信息: ${JSON.stringify(serverResponse.data, null, 2)}\n`;
          this.debugInfo += `连接状态: ${serverResponse.data.status}\n`;
        } else {
          this.debugInfo += `获取服务器信息失败: ${serverResponse?.error || '未知错误'}\n`;
        }
        
        // 执行简单命令
        this.debugInfo += '\n2. 执行简单命令测试:\n';
        const commandResponse = await this.$store.dispatch('servers/executeCommand', {
          serverId: this.serverId,
          command: 'uname -a && whoami && pwd'
        });
        
        if (commandResponse && commandResponse.success) {
          this.debugInfo += `命令输出:\n${commandResponse.data?.stdout || ''}\n`;
          this.debugInfo += `命令成功执行，服务器连接正常\n`;
        } else {
          this.debugInfo += `命令执行失败: ${commandResponse?.error || '未知错误'}\n`;
          this.debugInfo += `服务器连接可能存在问题\n`;
        }
        
        // 检查后端API配置
        this.debugInfo += '\n3. 检查前后端连接配置:\n';
        const baseURL = process.env.VUE_APP_API_URL || window.location.origin;
        this.debugInfo += `API基础URL: ${baseURL}\n`;
        this.debugInfo += `当前连接模式: ${process.env.NODE_ENV}\n`;
        
        // 检查网络连接
        this.debugInfo += '\n4. 检查网络连接:\n';
        try {
          const pingResponse = await this.$store.dispatch('servers/executeCommand', {
            serverId: this.serverId,
            command: 'ping -c 3 8.8.8.8'
          });
          
          if (pingResponse && pingResponse.success) {
            this.debugInfo += `ping测试结果:\n${pingResponse.data?.stdout || ''}\n`;
          } else {
            this.debugInfo += `ping测试失败: ${pingResponse?.error || '未知错误'}\n`;
          }
        } catch (error) {
          this.debugInfo += `ping测试错误: ${error.message}\n`;
        }
        
        this.$message.info('连接测试完成，请查看调试信息');
      } catch (error) {
        this.debugInfo += `\n测试过程出错: ${error.message}\n`;
        this.$message.error(`测试出错: ${error.message}`);
      } finally {
        this.debugging = false;
      }
    },
    async resetConnectionState() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法重置状态');
        return;
      }
      
      try {
        this.debugging = true;
        this.debugInfo = '正在重置连接状态...\n';
        
        // 执行断开连接命令
        try {
          this.debugInfo += '尝试断开当前连接...\n';
          const disconnectCommand = await this.$store.dispatch('servers/executeCommand', {
            serverId: this.serverId,
            command: 'echo "测试连接状态重置"'
          });
          
          this.debugInfo += '断开连接测试命令执行结果: ' + 
            (disconnectCommand?.success ? '成功' : '失败') + '\n';
        } catch (disconnectError) {
          this.debugInfo += `断开连接测试出错: ${disconnectError.message}\n`;
        }
        
        // 尝试重新连接服务器
        this.debugInfo += '尝试重新连接服务器...\n';
        
        try {
          const connectResponse = await this.connectServer(this.serverId);
          if (connectResponse && connectResponse.success) {
            this.debugInfo += '服务器重新连接成功\n';
          } else {
            this.debugInfo += `服务器重新连接失败: ${connectResponse?.error || '未知错误'}\n`;
          }
        } catch (connError) {
          this.debugInfo += `重新连接出错: ${connError.message}\n`;
        }
        
        // 重置本地初始化状态
        this.resetInitSteps();
        this.isInitialized = false;
        this.initStepActive = 0;
        
        // 重新获取服务器信息
        await this.checkInitialization();
        this.debugInfo += '初始化状态已重置，并重新检查\n';
        this.$message.success('连接状态已重置');
      } catch (error) {
        this.debugInfo += `\n重置过程出错: ${error.message}\n`;
        this.$message.error(`重置出错: ${error.message}`);
      } finally {
        this.debugging = false;
      }
    },
    async manualInitialize() {
      if (!this.hasValidServerId) {
        this.$message.error('未指定服务器ID，无法初始化');
        return;
      }
      
      try {
        this.loading = true;
        this.commandOutput = '正在手动初始化...\n';
        
        // 标记所有步骤为完成
        this.initializationSteps.forEach(step => step.done = true);
        this.isInitialized = true;
        
        // 刷新所有数据
        await this.refreshBlockList();
        await this.refreshSSHPort();
        await this.refreshInboundPorts();
        await this.refreshInboundIPs();
        
        this.commandOutput += '手动初始化完成，已跳过脚本检查\n';
        this.$message.success('手动初始化完成');
      } catch (error) {
        this.commandOutput += `\n手动初始化失败: ${error.message}\n`;
        this.$message.error(`初始化失败: ${error.message}`);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.rules-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.server-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.output {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.output-error {
  background-color: #fff8f8;
  border-left: 3px solid #F56C6C;
}

.el-divider {
  margin: 15px 0;
}

.initialization-card {
  margin-bottom: 20px;
}
.initialization-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.error-info {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 15px;
  color: #F56C6C;
}

.error-solution {
  margin-top: 10px;
}

.command-example {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.debug-info {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 15px;
}
</style> 