<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>汽车保养预约系统</span>
        </div>
      </template>

      <el-form :model="loginForm" ref="loginFormRef" label-width="60px">
        <el-form-item label="身份">
          <el-select
            v-model="loginForm.selectedRole"
            placeholder="请选择登录身份"
            style="width: 100%"
          >
            <el-option label="顾客" value="用户" />
            <el-option label="服务顾问" value="管理员" />
            <el-option label="维修技师" value="工作人员" />
          </el-select>
        </el-form-item>

        <div v-if="isFaceLogin && loginForm.selectedRole === '管理员'" class="face-section">
          <div class="video-wrapper">
            <video ref="videoPlayer" autoplay playsinline width="300" height="225"></video>
            <div class="scan-line"></div>
          </div>
          <el-button type="success" class="w-100" @click="handleFaceLogin" :loading="loading">
            立即识别并登录
          </el-button>
        </div>

        <div v-else>
          <el-form-item label="账号" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button type="primary" class="w-100" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </div>

        <div class="login-footer">
          <el-link
            v-if="loginForm.selectedRole === '管理员'"
            type="primary"
            @click="toggleFaceMode"
          >
            {{ isFaceLogin ? '返回账号登录' : '管理员专用：人脸识别登录' }}
          </el-link>

          <div class="register-link" v-if="loginForm.selectedRole === '用户'">
            <span>没有账号？</span>
            <el-link type="primary" @click="goToRegister">点击注册</el-link>
          </div>
        </div>
      </el-form>
      <canvas ref="canvasOutput" width="400" height="300" style="display: none;"></canvas>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const isFaceLogin = ref(false)

const videoPlayer = ref(null)
const canvasOutput = ref(null)
let mediaStream = null

const loginForm = reactive({
  username: '',
  password: '',
  selectedRole: '用户'
})

// 自动切换逻辑：角色一旦不是管理员，强制关闭人脸模式
watch(() => loginForm.selectedRole, (role) => {
  if (role !== '管理员') {
    isFaceLogin.value = false
    stopCamera()
  }
})

// 开启/关闭人脸模式
const toggleFaceMode = async () => {
  isFaceLogin.value = !isFaceLogin.value
  if (isFaceLogin.value) {
    await nextTick()
    startCamera()
  } else {
    stopCamera()
  }
}

const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 400, height: 300 }
    })
    if (videoPlayer.value) videoPlayer.value.srcObject = mediaStream
  } catch (err) {
    ElMessage.error('无法开启摄像头，请确保页面为 HTTPS 或 localhost')
    isFaceLogin.value = false
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
}

/**
 * 核心修改点：账号登录逻辑拦截
 */
const handleLogin = async () => {
  // 如果当前是管理员，拦截普通登录，强制切换到人脸
  if (loginForm.selectedRole === '管理员' && !isFaceLogin.value) {
    ElMessage.info('管理员身份请进行人脸验证')
    toggleFaceMode()
    return
  }

  // 正常校验
  if (!loginForm.username.trim() || !loginForm.password.trim()) {
    return ElMessage.warning('请输入用户名和密码')
  }

  loading.value = true
  try {
    const apiMap = { '用户': '/api/customer/login', '工作人员': '/api/worker/login', '管理员': '/api/admin/login' }
    const res = await request.post(`${apiMap[loginForm.selectedRole]}`, {
      username: loginForm.username,
      password: loginForm.password
    })

    if (res.success) {
      handleLoginSuccess(res.data)
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error('网络请求失败')
  } finally {
    loading.value = false
  }
}

// 人脸登录逻辑
const handleFaceLogin = async () => {
  const context = canvasOutput.value.getContext('2d')
  context.drawImage(videoPlayer.value, 0, 0, 400, 300)
  const base64Image = canvasOutput.value.toDataURL('image/png').split(',')[1]

  loading.value = true
  try {
    const res = await request.post('/api/admin/faceLogin', {
      image: base64Image
    })
    if (res.success) {
      stopCamera()
      handleLoginSuccess(res.data)
    } else {
      ElMessage.error(res.message || '人脸未匹配')
    }
  } catch (e) {
    // 响应拦截器里的 401 错误会被 request.js 捕获，这里处理其他异常
    console.error(e)
    ElMessage.error('识别异常')
  } finally {
    loading.value = false
  }
}

const handleLoginSuccess = (data) => {
  // data 此时对应后端返回的 resMap，包含 user 和 token
  const userData = data.user;
  const token = data.token;

  userData.role = loginForm.selectedRole;

  // 分别存储用户信息和 Token
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', token); // 供 request.js 拦截器读取

  ElMessage.success(`欢迎回来`);
  const jump = { '管理员': '/admin', '工作人员': '/worker', '用户': '/user' };
  router.push(jump[loginForm.selectedRole]);
}

const goToRegister = () => router.push('/register')
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%); }
.login-card { width: 400px; border-radius: 12px; }
.card-header { text-align: center; font-weight: bold; font-size: 20px; color: #409eff; }
.w-100 { width: 100%; margin-top: 15px; height: 40px; }

/* 人脸识别扫描样式 */
.face-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
.video-wrapper { position: relative; width: 300px; height: 225px; background: #000; border-radius: 8px; overflow: hidden; border: 2px solid #409eff; }
.scan-line { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: #409eff; box-shadow: 0 0 8px #409eff; animation: scan 2s infinite linear; }
@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }

.login-footer { margin-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.register-link { font-size: 14px; color: #606266; }
</style>
