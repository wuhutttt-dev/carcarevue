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
        <el-menu-item index="/admin/parts-purchase">
          <el-icon><ShoppingCart /></el-icon>
          <span>配件采购管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/parts-consumption">
          <el-icon><DocumentChecked /></el-icon>
          <span>配件消耗记录</span>
        </el-menu-item>
        <el-menu-item index="/admin/staff">
          <el-icon><Avatar /></el-icon>
          <span>员工档案管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/suppliers">
          <el-icon><OfficeBuilding /></el-icon>
          <span>供应商管理</span>
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

    <el-dialog v-model="profileDialogVisible" title="个人信息维护" width="550px" @closed="stopCamera" destroy-on-close>
      <el-form :model="editForm" label-width="100px" style="padding: 0 20px">
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="人脸识别">
          <div v-if="cameraActive" class="camera-wrapper">
            <video ref="videoPlayer" autoplay playsinline width="300" height="225" class="video-preview"></video>
            <div class="camera-actions">
              <el-button type="primary" size="small" @click="capturePhoto">拍摄照片</el-button>
              <el-button size="small" @click="stopCamera">关闭</el-button>
            </div>
          </div>
          <div v-else>
            <el-button type="warning" plain @click="startCamera">
              {{ editForm.faceId ? '重新录入人脸' : '开启摄像头录入' }}
            </el-button>
            <el-tag v-if="editForm.faceId" type="success" style="margin-left: 10px">已录入</el-tag>
            <el-tag v-if="hasCaptured" type="warning" style="margin-left: 10px">已抓拍待保存</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="头像设置">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:8080/api/admin/uploadAvatar"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            name="file"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">点击图片可重新上传</div>
        </el-form-item>
      </el-form>

      <canvas ref="canvasOutput" width="400" height="300" style="display: none;"></canvas>

      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存修改</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, List, Tools, User, CaretBottom, SwitchButton, Odometer, User as UserIcon, Avatar, Plus, ShoppingCart, DocumentChecked, OfficeBuilding} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const profileDialogVisible = ref(false)
const saveLoading = ref(false)

// 摄像头相关变量
const cameraActive = ref(false)
const hasCaptured = ref(false)
const videoPlayer = ref(null)
const canvasOutput = ref(null)
let mediaStream = null

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}));

const adminData = ref({})
const editForm = ref({
  id: '',
  realName: '',
  gender: '男',
  phone: '',
  email: '',
  avatar: '',
  faceId: '',    // 原有的 faceId
  faceImage: ''  // 抓拍的 Base64 数据
})

const currentPageName = computed(() => {
  const map = {
    '/admin/dashboard': '数据统计概览',
    '/admin/orders': '预约订单处理',
    '/admin/services': '服务项目维护',
    '/admin/users': '客户档案中心',
    '/admin/staff': '员工档案管理', // 补上原先遗漏的员工档案
    '/admin/parts-purchase': '配件采购管理', // 新增的汽车配件采购路由
    '/admin/parts-consumption': '配件消耗记录', // 新增映射
    '/admin/suppliers': '供应商管理'
  }
  return map[route.path] || '后台管理'
})

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) adminData.value = user
})

const openProfile = () => {
  editForm.value = JSON.parse(JSON.stringify(adminData.value))
  hasCaptured.value = false
  profileDialogVisible.value = true
}

// --- 摄像头逻辑开始 ---
const startCamera = async () => {
  cameraActive.value = true
  await nextTick()
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 400, height: 300 },
      audio: false
    })
    if (videoPlayer.value) {
      videoPlayer.value.srcObject = mediaStream
    }
  } catch (err) {
    ElMessage.error('无法开启摄像头：' + err.message)
    cameraActive.value = false
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  cameraActive.value = false
}

const capturePhoto = () => {
  const context = canvasOutput.value.getContext('2d')
  context.drawImage(videoPlayer.value, 0, 0, 400, 300)
  // 获取 Base64 并暂存
  editForm.value.faceImage = canvasOutput.value.toDataURL('image/png').split(',')[1]
  hasCaptured.value = true
  stopCamera()
  ElMessage.success('人脸照片已抓取，点击“保存修改”后生效')
}
// --- 摄像头逻辑结束 ---

const handleSave = async () => {
  saveLoading.value = true
  try {
    const res = await request.post('/api/admin/update', editForm.value)
    if (res.success) {
      ElMessage.success('个人信息更新成功')
      adminData.value = { ...editForm.value }
      // 后端应该返回更新后的 admin 对象，包含新的 faceId
      if (res.data) {
        adminData.value = res.data
      }
      localStorage.setItem('user', JSON.stringify(adminData.value))
      profileDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查后端 AdminController')
  } finally {
    saveLoading.value = false
  }
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  // 验证文件类型（必须为图片）
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  // 验证文件大小（限制 200MB）
  const isLt200M = file.size / 1024 / 1024 < 200
  if (!isLt200M) {
    ElMessage.error('图片大小不能超过 200MB！')
    return false
  }
  return true
}

// 头像上传成功回调
const handleAvatarSuccess = (response, uploadFile) => {
  if (response.success) {
    // 后端直接返回了 webPath 字符串放在 data 里 (Result.ok("上传成功", webPath))
    editForm.value.avatar = response.data
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出管理系统吗？', '提示', { type: 'warning' }).then(() => {
    localStorage.clear()
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

/* 摄像头样式控制 */
.camera-wrapper {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
  width: 300px;
}
.video-preview {
  display: block;
}
.camera-actions {
  padding: 5px;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  gap: 10px;
}
/* 头像上传组件样式 */
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px; /* 垂直居中 */
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>
