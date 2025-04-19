const Server = require('../models/Server');
const sshService = require('../services/sshService');

/**
 * 获取所有服务器
 */
exports.getAllServers = async (req, res) => {
  try {
    const servers = await Server.find();
    
    // 手动过滤敏感字段
    const filteredServers = servers.map(server => {
      const { password, privateKey, ...filtered } = server;
      return filtered;
    });
    
    res.status(200).json({
      success: true,
      data: filteredServers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务器列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个服务器
 */
exports.getServer = async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }
    
    // 手动过滤敏感字段
    const { password, privateKey, ...filteredServer } = server;
    
    res.status(200).json({
      success: true,
      data: filteredServer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务器信息失败',
      error: error.message
    });
  }
};

/**
 * 创建服务器
 */
exports.createServer = async (req, res) => {
  try {
    const { name, host, port, username, authType, password, privateKey } = req.body;
    
    // 创建服务器
    const server = await Server.create({
      name,
      host,
      port,
      username,
      authType,
      password,
      privateKey
    });
    
    // 手动过滤敏感字段
    const { password: pwd, privateKey: pk, ...filteredServer } = server;
    
    res.status(201).json({
      success: true,
      data: filteredServer,
      message: '服务器添加成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加服务器失败',
      error: error.message
    });
  }
};

/**
 * 更新服务器信息
 */
exports.updateServer = async (req, res) => {
  try {
    // 如果不更新敏感信息，移除这些字段
    if (!req.body.password) {
      delete req.body.password;
    }
    if (!req.body.privateKey) {
      delete req.body.privateKey;
    }
    
    const server = await Server.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }
    
    // 手动过滤敏感字段
    const { password, privateKey, ...filteredServer } = server;
    
    res.status(200).json({
      success: true,
      data: filteredServer,
      message: '服务器信息更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新服务器信息失败',
      error: error.message
    });
  }
};

/**
 * 删除服务器
 */
exports.deleteServer = async (req, res) => {
  try {
    // 先检查是否有活动连接
    if (sshService.connections[req.params.id]) {
      // 断开连接
      await sshService.disconnect(req.params.id);
    }
    
    const server = await Server.findByIdAndDelete(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '服务器已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除服务器失败',
      error: error.message
    });
  }
};

/**
 * 连接到服务器
 */
exports.connectServer = async (req, res) => {
  try {
    // 检查服务器是否存在
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }

    // 如果已连接，返回成功
    if (sshService.connections[req.params.id]) {
      return res.status(200).json({
        success: true,
        message: '服务器已连接'
      });
    }

    const result = await sshService.connect(req.params.id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('连接服务器错误:', error);
    res.status(500).json({
      success: false,
      message: '连接服务器失败',
      error: error.message
    });
  }
};

/**
 * 断开服务器连接
 */
exports.disconnectServer = async (req, res) => {
  try {
    const result = await sshService.disconnect(req.params.id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '断开服务器连接失败',
      error: error.message
    });
  }
};

/**
 * 在服务器上执行系统命令
 */
exports.executeCommand = async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: '命令不能为空'
      });
    }
    
    const result = await sshService.executeCommand(req.params.id, command);
    
    res.status(200).json({
      success: true,
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '执行命令失败',
      error: error.message
    });
  }
};

/**
 * 检测服务器状态
 */
exports.checkServerStatus = async (req, res) => {
  try {
    const serverId = req.params.id;
    const server = await Server.findById(serverId);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }
    
    // 检查连接状态
    const isConnected = !!sshService.connections[serverId];
    
    // 如果数据库状态与实际连接状态不符，更新数据库
    if ((server.status === 'online' && !isConnected) || 
        (server.status !== 'online' && isConnected)) {
      await Server.findByIdAndUpdate(serverId, {
        status: isConnected ? 'online' : 'offline',
        updatedAt: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        status: isConnected ? 'online' : 'offline'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查服务器状态失败',
      error: error.message
    });
  }
};

/**
 * 部署iptato脚本到服务器
 */
exports.deployIptato = async (req, res) => {
  try {
    // 检查服务器是否存在
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: '服务器未找到'
      });
    }

    // 检查服务器是否已连接
    if (!sshService.connections[req.params.id]) {
      return res.status(400).json({
        success: false,
        message: '服务器未连接，请先连接服务器'
      });
    }

    // 检查脚本是否已存在
    try {
      const scriptCheck = await sshService.executeCommand(req.params.id, 'test -f /root/iptato.sh && echo "exists" || echo "not found"');
      if (scriptCheck.stdout.includes('exists')) {
        // 脚本已存在，重新部署
        await sshService.executeCommand(req.params.id, 'rm -f /root/iptato.sh');
      }
    } catch (checkError) {
      // 检查失败，继续部署
      console.warn('检查脚本存在状态失败，继续部署:', checkError.message);
    }

    const result = await sshService.deployIptato(req.params.id);
    
    // 部署完成后，设置执行权限
    await sshService.executeCommand(req.params.id, 'chmod +x /root/iptato.sh');
    
    res.status(200).json({
      success: true,
      message: '脚本部署成功'
    });
  } catch (error) {
    console.error('部署脚本错误:', error);
    res.status(500).json({
      success: false,
      message: '部署iptato脚本失败',
      error: error.message
    });
  }
}; 