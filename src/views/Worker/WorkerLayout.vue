<template>
  <div class="worker-layout">
    <el-header class="worker-header">
      <div class="logo">
        <el-icon><Tools /></el-icon>
        <span>技师工作台</span>
      </div>
      <div class="user-info">
        <el-tag type="success" effect="dark" size="small">{{ user.realName }}</el-tag>
        <el-button type="info" link @click="handleLogout">退出</el-button>
      </div>
    </el-header>

    <el-main class="worker-main">
      <router-view />
    </el-main>

    <div class="worker-footer-nav">
      <div class="nav-item active">
        <el-icon><List /></el-icon>
        <span>任务处理</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Tools, List } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{"realName":"技师"}')

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.worker-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}
.worker-header {
  background-color: #001529;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}
.worker-main {
  padding: 15px;
}
.worker-footer-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 55px;
  background: white;
  display: flex;
  border-top: 1px solid #eee;
  justify-content: space-around;
  align-items: center;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #909399;
}
.nav-item.active {
  color: #409eff;
}
</style>
