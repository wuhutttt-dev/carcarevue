<template>
  <el-container class="user-layout">
    <el-header class="header">
      <div class="logo">用户中心</div>
      <div class="user-tools">
        <span>欢迎，{{ username }}</span>
        <el-button type="danger" size="small" @click="handleLogout" plain>退出</el-button>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="services">
            <el-icon><Goods /></el-icon>
            <span>服务项目</span>
          </el-menu-item>
          <el-menu-item index="appointments">
            <el-icon><Calendar /></el-icon>
            <span>预约服务</span>
          </el-menu-item>
          <el-menu-item index="history">
            <el-icon><List /></el-icon>
            <span>我的预约</span>
          </el-menu-item>
          <el-menu-item index="profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="service-history">
            <el-icon><Histogram /></el-icon>
            <span>服务历史</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, List, User, Histogram, Goods } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const username = ref('加载中...')
const activeMenu = ref('appointments')

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) {
    router.push('/login')
  } else {
    username.value = user.username
  }
  // 根据当前路径设置激活菜单
  activeMenu.value = route.path.split('/').pop() || 'appointments'
})

const handleMenuSelect = (index) => {
  router.push(`/user/${index}`)
}

const handleLogout = () => {
  localStorage.removeItem('user')
  router.push('/login')
  ElMessage.success('已安全退出')
}
</script>

<style scoped>
.user-layout { height: 100vh; }
.header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo { font-size: 20px; font-weight: bold; }
.sidebar-menu { height: 100%; border-right: none; }
.main-content { background-color: #f5f7fa; padding: 20px; }
.user-tools { display: flex; align-items: center; gap: 10px; }
</style>
