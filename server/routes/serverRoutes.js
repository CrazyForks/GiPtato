const express = require('express');
const serverController = require('../controllers/serverController');
const router = express.Router();

// 服务器管理路由
router.get('/', serverController.getAllServers);
router.post('/', serverController.createServer);
router.get('/:id', serverController.getServer);
router.put('/:id', serverController.updateServer);
router.delete('/:id', serverController.deleteServer);

// 服务器连接路由
router.post('/:id/connect', serverController.connectServer);
router.post('/:id/disconnect', serverController.disconnectServer);
router.post('/:id/execute', serverController.executeCommand);
router.get('/:id/status', serverController.checkServerStatus);

// iPtato部署路由
router.post('/:id/deploy', serverController.deployIptato);

module.exports = router; 