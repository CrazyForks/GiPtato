const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const Server = require('../models/Server');

class SSHService {
  constructor() {
    this.connections = {}; // 存储活跃的SSH连接
  }

  /**
   * 连接到服务器
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 连接结果
   */
  async connect(serverId) {
    try {
      // 查找服务器信息
      const server = await Server.findById(serverId);
      if (!server) {
        throw new Error('服务器未找到');
      }

      // 创建SSH连接
      const conn = new Client();
      
      // 准备连接配置
      const config = {
        host: server.host,
        port: server.port,
        username: server.username,
      };

      // 根据认证类型设置认证信息
      if (server.authType === 'password') {
        config.password = server.password;
      } else {
        config.privateKey = server.privateKey;
      }

      // 创建Promise以处理连接
      return new Promise((resolve, reject) => {
        // 连接错误处理
        conn.on('error', (err) => {
          this._updateServerStatus(serverId, 'error');
          reject(err);
        });

        // 准备连接
        conn.on('ready', () => {
          // 存储活跃连接
          this.connections[serverId] = conn;
          
          // 更新服务器状态
          this._updateServerStatus(serverId, 'online');
          
          resolve({
            success: true,
            message: '连接成功',
            serverId
          });
        });

        // 开始连接
        conn.connect(config);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 在服务器上执行命令
   * @param {string} serverId - 服务器ID
   * @param {string} command - 要执行的命令
   * @returns {Promise<object>} - 命令执行结果
   */
  async executeCommand(serverId, command) {
    try {
      const conn = this.connections[serverId];
      
      if (!conn) {
        throw new Error('无有效连接，请先连接服务器');
      }

      return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let stdout = '';
          let stderr = '';

          stream.on('close', (code) => {
            resolve({
              code,
              stdout,
              stderr
            });
          });

          stream.on('data', (data) => {
            stdout += data.toString();
          });

          stream.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 上传文件到服务器
   * @param {string} serverId - 服务器ID
   * @param {string} localPath - 本地文件路径
   * @param {string} remotePath - 远程文件路径
   * @returns {Promise<object>} - 上传结果
   */
  async uploadFile(serverId, localPath, remotePath) {
    try {
      const conn = this.connections[serverId];
      
      if (!conn) {
        throw new Error('无有效连接，请先连接服务器');
      }

      return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }

          const readStream = fs.createReadStream(localPath);
          const writeStream = sftp.createWriteStream(remotePath);

          writeStream.on('close', () => {
            resolve({
              success: true,
              message: '文件上传成功'
            });
          });

          writeStream.on('error', (err) => {
            reject(err);
          });

          readStream.pipe(writeStream);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从服务器下载文件
   * @param {string} serverId - 服务器ID
   * @param {string} remotePath - 远程文件路径
   * @param {string} localPath - 本地文件路径
   * @returns {Promise<object>} - 下载结果
   */
  async downloadFile(serverId, remotePath, localPath) {
    try {
      const conn = this.connections[serverId];
      
      if (!conn) {
        throw new Error('无有效连接，请先连接服务器');
      }

      return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }

          const readStream = sftp.createReadStream(remotePath);
          const writeStream = fs.createWriteStream(localPath);

          writeStream.on('close', () => {
            resolve({
              success: true,
              message: '文件下载成功'
            });
          });

          writeStream.on('error', (err) => {
            reject(err);
          });

          readStream.pipe(writeStream);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 断开服务器连接
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 断开结果
   */
  async disconnect(serverId) {
    try {
      const conn = this.connections[serverId];
      
      if (!conn) {
        return {
          success: true,
          message: '无需断开，连接不存在'
        };
      }

      // 断开连接
      conn.end();
      
      // 删除连接记录
      delete this.connections[serverId];
      
      // 更新服务器状态
      await this._updateServerStatus(serverId, 'offline');
      
      return {
        success: true,
        message: '连接已断开'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 断开所有服务器连接
   * @returns {Promise<object>} - 断开结果
   */
  async disconnectAll() {
    try {
      const serverIds = Object.keys(this.connections);
      
      for (const serverId of serverIds) {
        await this.disconnect(serverId);
      }
      
      return {
        success: true,
        message: '所有连接已断开',
        count: serverIds.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新服务器状态
   * @param {string} serverId - 服务器ID
   * @param {string} status - 新状态
   * @returns {Promise<void>}
   */
  async _updateServerStatus(serverId, status) {
    try {
      await Server.findByIdAndUpdate(serverId, {
        status: status,
        lastConnection: status === 'online' ? new Date() : undefined,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('更新服务器状态失败:', error);
    }
  }

  /**
   * 上传并执行iPtato.sh脚本
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 执行结果
   */
  async deployIptato(serverId) {
    try {
      // 本地脚本路径
      const localScriptPath = path.join(__dirname, '../scripts/iPtato.sh');
      console.log(`部署脚本的本地路径: ${localScriptPath}`);
      
      // 检查本地脚本是否存在
      if (!fs.existsSync(localScriptPath)) {
        console.error(`错误: 本地脚本不存在: ${localScriptPath}`);
        return {
          success: false,
          message: '本地iPtato脚本文件不存在，请检查安装'
        };
      }
      
      // 远程脚本路径
      const remoteScriptPath = '/root/iPtato.sh';
      
      // 上传脚本
      await this.uploadFile(serverId, localScriptPath, remoteScriptPath);
      console.log(`脚本已上传到服务器 ${serverId}: ${remoteScriptPath}`);
      
      // 设置执行权限
      await this.executeCommand(serverId, `chmod +x ${remoteScriptPath}`);
      
      return {
        success: true,
        message: 'iPtato脚本已部署到服务器'
      };
    } catch (error) {
      console.error(`部署脚本时发生错误:`, error);
      throw error;
    }
  }

  /**
   * 在服务器上执行iPtato脚本命令
   * @param {string} serverId - 服务器ID
   * @param {string|number} action - 要执行的操作代码
   * @returns {Promise<object>} - 执行结果
   */
  async executeIptato(serverId, action) {
    try {
      // 检查连接是否存在
      const conn = this.connections[serverId];
      if (!conn) {
        return {
          success: false,
          output: '',
          error: '服务器未连接，请先连接服务器',
          code: -1
        };
      }

      // 检查脚本是否存在
      const scriptCheck = await this.executeCommand(serverId, 'test -f /root/iPtato.sh && echo "exists" || echo "not found"');
      if (scriptCheck.stdout.includes('not found')) {
        return {
          success: false,
          output: '',
          error: 'iPtato脚本未找到，请先部署脚本',
          code: -1
        };
      }

      // 检查脚本是否有执行权限
      const permCheck = await this.executeCommand(serverId, 'test -x /root/iPtato.sh && echo "executable" || echo "not executable"');
      if (permCheck.stdout.includes('not executable')) {
        // 自动修复执行权限
        await this.executeCommand(serverId, 'chmod +x /root/iPtato.sh');
      }

      // 执行脚本命令
      const command = `bash /root/iPtato.sh ${action}`;
      const result = await this.executeCommand(serverId, command);
      
      // 检查执行结果
      if (result.code !== 0) {
        return {
          success: false,
          output: result.stdout,
          error: result.stderr || '脚本执行失败',
          code: result.code
        };
      }

      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        code: result.code
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `执行脚本失败: ${error.message}`,
        code: -1
      };
    }
  }
}

module.exports = new SSHService(); 