const sshService = require('./sshService');

class IptablesService {
  /**
   * 检查前置条件
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 检查结果
   */
  async _checkPrerequisites(serverId) {
    try {
      // 检查SSH连接
      const connection = sshService.connections[serverId];
      if (!connection) {
        return {
          success: false,
          error: '服务器未连接，请先连接服务器'
        };
      }
      
      // 检查脚本是否存在
      const scriptCheck = await sshService.executeCommand(serverId, 'test -f /root/iPtato.sh && echo "exists" || echo "not found"');
      if (scriptCheck.stdout.includes('not found')) {
        return {
          success: false,
          error: 'iPtato脚本未部署，请先部署脚本'
        };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `检查前置条件失败: ${error.message}`
      };
    }
  }

  /**
   * 获取服务器上的当前封禁列表
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 封禁列表结果
   */
  async getBlockList(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 0);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `获取封禁列表失败: ${error.message}`
      };
    }
  }

  /**
   * 封禁BT/PT协议
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async blockBTPT(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 1);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `封禁BT/PT协议失败: ${error.message}`
      };
    }
  }

  /**
   * 封禁垃圾邮件端口
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async blockSPAM(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 2);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `封禁垃圾邮件端口失败: ${error.message}`
      };
    }
  }

  /**
   * 封禁BT/PT和垃圾邮件
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async blockAll(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 3);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `封禁全部失败: ${error.message}`
      };
    }
  }

  /**
   * 封禁自定义端口
   * @param {string} serverId - 服务器ID
   * @param {string} ports - 要封禁的端口
   * @returns {Promise<object>} - 操作结果
   */
  async blockCustomPorts(serverId, ports) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 这个操作需要交互式输入，我们需要用特殊方式处理
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ports}" | bash /root/iPtato.sh 4
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_block_ports.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `封禁自定义端口失败: ${error.message}`
      };
    }
  }

  /**
   * 封禁自定义关键词
   * @param {string} serverId - 服务器ID
   * @param {string} keyword - 要封禁的关键词
   * @returns {Promise<object>} - 操作结果
   */
  async blockCustomKeyword(serverId, keyword) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "1" | bash /root/iPtato.sh 5 > /dev/null
echo "${keyword}" | bash /root/iPtato.sh
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_block_keyword.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `封禁自定义关键词失败: ${error.message}`
      };
    }
  }

  /**
   * 解封BT/PT协议
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async unblockBTPT(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 6);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封BT/PT协议失败: ${error.message}`
      };
    }
  }

  /**
   * 解封垃圾邮件端口
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async unblockSPAM(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 7);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封垃圾邮件端口失败: ${error.message}`
      };
    }
  }

  /**
   * 解封BT/PT和垃圾邮件
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async unblockAll(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 8);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封BT/PT和垃圾邮件失败: ${error.message}`
      };
    }
  }

  /**
   * 解封自定义端口
   * @param {string} serverId - 服务器ID
   * @param {string} ports - 要解封的端口
   * @returns {Promise<object>} - 操作结果
   */
  async unblockCustomPorts(serverId, ports) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ports}" | bash /root/iPtato.sh 9
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_unblock_ports.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封自定义端口失败: ${error.message}`
      };
    }
  }

  /**
   * 解封自定义关键词
   * @param {string} serverId - 服务器ID
   * @param {string} keyword - 要解封的关键词
   * @returns {Promise<object>} - 操作结果
   */
  async unblockCustomKeyword(serverId, keyword) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "1" | bash /root/iPtato.sh 10 > /dev/null
echo "${keyword}" | bash /root/iPtato.sh
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_unblock_keyword.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封自定义关键词失败: ${error.message}`
      };
    }
  }

  /**
   * 解封所有关键词
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async unblockAllKeywords(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 11);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `解封所有关键词失败: ${error.message}`
      };
    }
  }

  /**
   * 获取当前放行的入网端口
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async getInboundPorts(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 13);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `获取入网端口失败: ${error.message}`
      };
    }
  }

  /**
   * 获取当前放行的入网IP
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async getInboundIPs(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 14);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `获取入网IP失败: ${error.message}`
      };
    }
  }

  /**
   * 放行入网端口
   * @param {string} serverId - 服务器ID
   * @param {string} ports - 要放行的端口
   * @returns {Promise<object>} - 操作结果
   */
  async allowInboundPorts(serverId, ports) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ports}" | bash /root/iPtato.sh 15
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_allow_ports.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `放行入网端口失败: ${error.message}`
      };
    }
  }

  /**
   * 取消放行入网端口
   * @param {string} serverId - 服务器ID
   * @param {string} ports - 要取消放行的端口
   * @returns {Promise<object>} - 操作结果
   */
  async disallowInboundPorts(serverId, ports) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ports}" | bash /root/iPtato.sh 16
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_disallow_ports.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `取消放行入网端口失败: ${error.message}`
      };
    }
  }

  /**
   * 放行入网IP
   * @param {string} serverId - 服务器ID
   * @param {string} ips - 要放行的IP
   * @returns {Promise<object>} - 操作结果
   */
  async allowInboundIPs(serverId, ips) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ips}" | bash /root/iPtato.sh 17
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_allow_ips.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `放行入网IP失败: ${error.message}`
      };
    }
  }

  /**
   * 取消放行入网IP
   * @param {string} serverId - 服务器ID
   * @param {string} ips - 要取消放行的IP
   * @returns {Promise<object>} - 操作结果
   */
  async disallowInboundIPs(serverId, ips) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      // 创建一个临时脚本来处理交互式输入
      const tempScriptContent = `#!/bin/bash
echo "${ips}" | bash /root/iPtato.sh 18
exit $?
`;
      
      // 上传临时脚本
      const tempScriptPath = '/tmp/iPtato_disallow_ips.sh';
      await sshService.executeCommand(serverId, `echo '${tempScriptContent}' > ${tempScriptPath} && chmod +x ${tempScriptPath}`);
      
      // 执行临时脚本
      const result = await sshService.executeCommand(serverId, `bash ${tempScriptPath}`);
      
      // 清理临时脚本
      await sshService.executeCommand(serverId, `rm ${tempScriptPath}`);
      
      return {
        success: result.code === 0,
        data: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `取消放行入网IP失败: ${error.message}`
      };
    }
  }

  /**
   * 查看当前SSH端口
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async getSSHPort(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 19);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `获取SSH端口失败: ${error.message}`
      };
    }
  }

  /**
   * 清空所有规则
   * @param {string} serverId - 服务器ID
   * @returns {Promise<object>} - 操作结果
   */
  async clearAllRules(serverId) {
    try {
      // 检查前置条件
      const prereqCheck = await this._checkPrerequisites(serverId);
      if (!prereqCheck.success) {
        return prereqCheck;
      }
      
      const result = await sshService.executeIptato(serverId, 20);
      return {
        success: result.success,
        data: result.output,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `清空所有规则失败: ${error.message}`
      };
    }
  }
}

module.exports = new IptablesService(); 