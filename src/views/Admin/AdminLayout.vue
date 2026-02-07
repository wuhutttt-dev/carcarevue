<template>
  <el-container class="admin-layout">
    <el-aside width="240px" class="admin-aside">
      <div class="admin-logo">
        <el-icon :size="24"><Monitor /></el-icon>
        <span>车管家后台管理</span>
      </div>
      <el-menu router :default-active="route.path" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item index="/admin/dashboard"><el-icon><Odometer /></el-icon><span>数据统计概览</span></el-menu-item>
        <el-menu-item index="/admin/orders"><el-icon><List /></el-icon><span>预约订单处理</span></el-menu-item>
        <el-menu-item index="/admin/services"><el-icon><Tools /></el-icon><span>服务项目维护</span></el-menu-item>
        <el-menu-item index="/admin/users"><el-icon><User /></el-icon><span>客户档案中心</span></el-menu-item>
        <el-menu-item index="/admin/staff">
          <el-icon><Avatar /></el-icon>
          <span>员工档案管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="breadcrumb"><span>当前位置：{{ currentPageName }}</span></div>
        <div class="admin-info">
          <el-dropdown trigger="click">
            <div class="user-profile">
              <el-avatar :size="35" :src="adminData.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              <span class="admin-name">{{ adminData.realName || '管理员' }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="UserIcon" @click="openProfile">个人中心</el-dropdown-item>
                <el-dropdown-item :icon="SwitchButton" divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>

    <el-dialog v-model="profileDialogVisible" title="个人信息维护" width="550px" destroy-on-close>
      <el-form :model="editForm" label-width="100px" style="padding: 0 20px">
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="头像链接">
          <el-input v-model="editForm.avatar" placeholder="图片 URL 地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存修改</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, List, Tools, User, CaretBottom, SwitchButton, Odometer, User as UserIcon, Avatar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const profileDialogVisible = ref(false)
const saveLoading = ref(false)

// 当前登录的管理员原始数据
const adminData = ref({})
// 弹窗编辑用的临时数据，防止未保存就直接修改了导航栏显示
const editForm = ref({
  id: '',
  realName: '',
  gender: '男',
  phone: '',
  email: '',
  avatar: ''
})

const currentPageName = computed(() => {
  const map = { '/admin/dashboard': '数据统计概览', '/admin/orders': '预约订单处理', '/admin/services': '服务项目维护', '/admin/users': '客户档案中心' }
  return map[route.path] || '后台管理'
})

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) adminData.value = user
})

// 打开弹窗并深拷贝数据
const openProfile = () => {
  editForm.value = JSON.parse(JSON.stringify(adminData.value))
  profileDialogVisible.value = true
}

// 保存修改到后端及本地缓存
const handleSave = async () => {
  saveLoading.value = true
  try {
    // 注意：此处 URL 需对应你后端的更新接口，通常在 AdminController 中
    const res = await axios.post('http://localhost:8080/api/admin/update', editForm.value)
    if (res.data.success) {
      ElMessage.success('个人信息更新成功')
      adminData.value = { ...editForm.value }
      localStorage.setItem('user', JSON.stringify(adminData.value))
      profileDialogVisible.value = false
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查后端 AdminController')
  } finally {
    saveLoading.value = false
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出管理系统吗？', '提示', { type: 'warning' }).then(() => {
    localStorage.removeItem('user')
    router.push('/login')
  })
}
</script>

<style scoped>
.admin-layout { height: 100vh; }
.admin-aside { background-color: #304156; }
.admin-logo { height: 60px; display: flex; align-items: center; justify-content: center; color: white; background: #2b2f3a; gap: 10px; font-weight: bold; }
.admin-header { background: white; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.user-profile { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.admin-name { font-size: 14px; color: #666; }
.admin-main { background-color: #f0f2f5; padding: 20px; }
/* 针对侧边栏菜单图标的微调 */
.admin-menu .el-icon {
  margin-right: 8px !important; /* 将默认的大间距缩小为 8px */
  font-size: 18px;            /* 统一图标大小 */
}

/* 确保文字对齐 */
.admin-menu el-menu-item span {
  display: inline-block;
  vertical-align: middle;
}
</style>
