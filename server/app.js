const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 导入路由
const serverRoutes = require('./routes/serverRoutes');
const rulesRoutes = require('./routes/rulesRoutes');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')));

// 检查并创建数据目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 检查并创建服务器数据文件
const serversDataPath = path.join(dataDir, 'servers.json');
if (!fs.existsSync(serversDataPath)) {
  fs.writeFileSync(serversDataPath, JSON.stringify({ servers: [] }, null, 2));
}

// 检查并创建规则数据文件
const rulesDataPath = path.join(dataDir, 'rules.json');
if (!fs.existsSync(rulesDataPath)) {
  fs.writeFileSync(rulesDataPath, JSON.stringify({ rules: [] }, null, 2));
}

// 检查并创建脚本目录
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// 检查并复制脚本文件
const sourceScriptPath = path.join(__dirname, '../iPtato.sh');
const targetScriptPath = path.join(scriptsDir, 'iptato.sh');
if (fs.existsSync(sourceScriptPath) && !fs.existsSync(targetScriptPath)) {
  fs.copyFileSync(sourceScriptPath, targetScriptPath);
}

// API路由
app.use('/api/servers', serverRoutes);
app.use('/api/rules', rulesRoutes);

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 