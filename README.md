# GiPtato Panel - 多服务器防火墙规则管理面板

基于iPtato.sh脚本开发的可视化多服务器防火墙规则管理面板，支持通过SSH远程连接管理多台服务器的iptables规则。

## 功能特色

- **多服务器管理**：集中管理多台服务器的防火墙规则
- **出网控制**：封禁/解封 BT、PT、SPAM、自定义端口和关键词
- **入网控制**：管理入网端口和IP白名单
- **SSH远程控制**：通过SSH安全连接到远程服务器执行命令
- **可视化操作**：直观的界面操作替代复杂的命令行管理
- **状态监控**：实时查看各服务器的连接状态和规则列表

## 技术栈

- **后端**：Node.js、Express、SSH2、本地JSON存储
- **前端**：Vue.js 2.x、Element UI、Axios
- **通信**：RESTful API

## 系统要求

- Node.js 12.x以上
- 远程服务器需支持SSH连接

## 安装部署

### 1. 克隆项目

```bash
git clone https://github.com/Fiftonb/GiPtato.git
cd GiPtato
```

### 2. 安装依赖

一键安装所有依赖:

```bash
npm run setup
```

或使用:

```bash
npm run install:all
```

### 3. 配置环境变量

复制`.env.example`文件为`.env`，或直接创建`.env`文件，并根据实际情况修改:

```bash
cp .env.example .env
```

配置示例:

```
# 服务器配置
PORT=3001
CORS_ORIGIN=http://localhost:8080

# 数据目录配置
DATA_DIR=./server/data

# 数据库配置
DB_PATH=./data/database.json

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# 临时文件目录
TMP_DIR=./tmp

# 应用模式配置
NODE_ENV=development
# 设置为 true 可避免 nodemon 频繁重启
STABLE_MODE=true
```

### 4. 构建与启动

一键构建前端并启动服务:

```bash
# 构建前端 (将构建结果输出到 server/public 目录)
npm run build

# 启动后端服务器
npm start
```

或使用一键启动脚本(开发模式):

```bash
./start-all.sh
```

## 开发模式

同时启动前端和后端开发服务器:

```bash
npm run dev
```

仅启动后端服务器:

```bash
npm run dev:server
```

仅启动前端开发服务器:

```bash
npm run dev:client
```

## 服务访问

- 前端界面: http://localhost:8080 (开发模式)或 http://localhost:3001 (生产模式)
- 后端API: http://localhost:3001/api

## 使用指南

1. 访问前端界面进入管理面板
2. 添加服务器：点击"添加服务器"，填写服务器信息并测试连接
3. 连接服务器：在服务器列表中点击"连接"按钮
4. 管理规则：点击"管理规则"进入相应服务器的规则管理页面
5. 根据需要配置出入网规则

## 安全提示

- 请确保使用安全的密码
- 建议使用SSH密钥认证而非密码认证
- 服务器连接信息（特别是密码和私钥）存储在本地JSON文件中

## 许可证

MIT License

## 项目参考

本项目基于[iPtato脚本](https://github.com/Aipblock/iPtato)开发
> 原脚本作者已经三年没有更新，基于脚本使用Ai工具完善了点功能，然后开发这个面板

# iPtato
通过简单的脚本，实现控制系统的出入网络流量
## 功能简介
### 适配系统
Debian\Centos\Ubuntu


