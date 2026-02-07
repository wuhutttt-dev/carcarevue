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
            <el-option label="管理员" value="管理员" />
            <el-option label="工作人员" value="工作人员" />
          </el-select>
        </el-form-item>

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

        <el-button
          type="primary"
          class="w-100"
          @click="handleLogin"
          :loading="loading"
        >
          登录
        </el-button>

        <div class="register-link" v-if="loginForm.selectedRole === '用户'">
          <span>没有账号？</span>
          <el-link type="primary" @click="goToRegister">点击注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  selectedRole: '用户' // 默认选中“顾客”
})

// 处理登录逻辑
const handleLogin = async () => {
  // 1. 基本表单验证
  if (!loginForm.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!loginForm.password.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true

  try {
    // 2. 根据选择的角色确定映射的后端接口地址
    const roleApiMap = {
      '用户': '/api/customer/login',
      '工作人员': '/api/worker/login',
      '管理员': '/api/admin/login'
    }

    const apiPath = roleApiMap[loginForm.selectedRole]
    const apiUrl = `http://localhost:8080${apiPath}`

    console.log(`[Login] 正在以 ${loginForm.selectedRole} 身份尝试登录: ${apiUrl}`)

    // 3. 发送登录请求
    const response = await axios.post(apiUrl, {
      username: loginForm.username,
      password: loginForm.password
    })

    // 4. 响应逻辑处理 (基于后端返回 Result 对象)
    if (response.data && response.data.success === true) {
      const userData = response.data.data

      if (!userData) {
        ElMessage.error('服务器未返回有效用户信息')
        return
      }

      // 关键：手动补全角色信息，方便后续全局权限判断
      userData.role = loginForm.selectedRole

      // 安全清理：不存储敏感字段
      delete userData.password

      // 5. 持久化存储
      localStorage.setItem('user', JSON.stringify(userData))
      ElMessage.success(`欢迎回来，${userData.realName || userData.username}`)

      // 6. 精准路由跳转
      if (loginForm.selectedRole === '管理员') {
        router.push('/admin')
      } else if (loginForm.selectedRole === '工作人员') {
        router.push('/worker')
      } else {
        router.push('/user') // 跳转到你刚才创建的用户主页
      }

    } else {
      // 登录失败：显示后端传回的错误消息
      ElMessage.error(response.data.message || '登录失败，请检查账号密码')
    }

  } catch (error) {
    console.error('登录请求异常:', error)
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 统一错误处理
const handleError = (error) => {
  if (error.response) {
    const status = error.response.status
    if (status === 404) ElMessage.error('接口地址错误 (404)')
    else if (status === 403) ElMessage.error('跨域被拒绝或权限不足 (403)')
    else if (status === 500) ElMessage.error('服务器内部错误 (500)')
    else ElMessage.error(`系统异常: ${status}`)
  } else if (error.code === 'ERR_NETWORK') {
    // 针对跨域 (CORS) 或后端未启动的典型报错提示
    ElMessage.error('网络连接失败：请检查后端是否启动及CORS跨域配置')
  } else {
    ElMessage.error('登录请求失败')
  }
}

// 跳转注册
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 渐变色背景 */
  background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%);
}

.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: #409eff;
}

.w-100 {
  width: 100%;
  margin-top: 15px;
  height: 40px;
  font-size: 16px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.register-link .el-link {
  margin-left: 5px;
  vertical-align: baseline;
}
</style>
