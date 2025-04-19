<template>
  <div id="app">
    <el-header class="header" v-if="isAuthenticated">
      <div class="header-left">
        <h1>GiPtato 防火墙管理系统</h1>
      </div>
      <div class="header-right">
        <span v-if="currentUser">{{ currentUser.username }}</span>
        <el-button type="text" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>
    <router-view />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import axios from 'axios';

export default {
  name: 'App',
  computed: {
    ...mapGetters(['isAuthenticated', 'currentUser'])
  },
  methods: {
    ...mapActions(['logout', 'getCurrentUser']),
    
    handleLogout() {
      this.logout();
      this.$router.push('/login');
      this.$message.success('已退出登录');
    }
  },
  created() {
    // 页面加载时设置认证头
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // 获取当前用户信息
      this.getCurrentUser();
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-right span {
  margin-right: 10px;
}
</style> 