const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 打印环境变量
console.log('===== 服务器配置 =====');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 3001}`);
console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
console.log(`STABLE_MODE: ${process.env.STABLE_MODE}`);
console.log('======================');

// 导入路由
const serverRoutes = require('./routes/serverRoutes');
const rulesRoutes = require('./routes/rulesRoutes');

// 创建Express应用
const app = express();

// CORS配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
};
console.log(`CORS配置: 允许来源 ${corsOptions.origin}`);

// 中间件
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')));

// 使用环境变量中的DATA_DIR或默认路径，处理相对路径
let dataDir;
if (process.env.DATA_DIR) {
  // 处理相对路径，将它转换为相对于项目根目录的绝对路径
  if (process.env.DATA_DIR.startsWith('./')) {
    dataDir = path.join(__dirname, '..', process.env.DATA_DIR.substring(2));
  } else {
    dataDir = path.resolve(process.env.DATA_DIR);
  }
} else {
  dataDir = path.join(__dirname, 'data');
}

console.log(`使用的数据目录: ${dataDir}`);

// 检查并创建数据目录
if (!fs.existsSync(dataDir)) {
  // 使用recursive确保所有必要的父目录也会被创建
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`数据目录已创建: ${dataDir}`);
}

// 检查并创建服务器数据文件
const serversDataPath = path.join(dataDir, 'servers.json');
if (!fs.existsSync(serversDataPath)) {
  fs.writeFileSync(serversDataPath, JSON.stringify({ servers: [] }, null, 2));
  console.log(`服务器数据文件已创建: ${serversDataPath}`);
}

// 检查并创建规则数据文件
const rulesDataPath = path.join(dataDir, 'rules.json');
if (!fs.existsSync(rulesDataPath)) {
  fs.writeFileSync(rulesDataPath, JSON.stringify({ rules: [] }, null, 2));
  console.log(`规则数据文件已创建: ${rulesDataPath}`);
}

// 检查并创建脚本目录
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// 检查并复制脚本文件
const sourceScriptPath = path.join(__dirname, '../iPtato.sh');
const targetScriptPath = path.join(scriptsDir, 'iPtato.sh');
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 