<template>
  <div class="register-container">
    <div class="bg-decoration"></div>

    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <div class="logo-icon">
            <i class="el-icon-user-solid"></i>
          </div>
          <h2>新客户注册</h2>
          <p class="subtitle">Join Our Car Service System</p>
        </div>
      </template>

      <el-form :model="regForm" :rules="rules" ref="regFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="regForm.username" placeholder="建议使用手机号或英文" size="large" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="设置密码" prop="password">
            <el-input v-model="regForm.password" type="password" placeholder="请输入密码" show-password size="large" />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="regForm.confirmPassword" type="password" placeholder="请再次输入" show-password size="large" />
          </el-form-item>
        </div>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="regForm.phone" placeholder="用于接收保养通知" size="large">
            <template #prefix>+86</template>
          </el-input>
        </el-form-item>

        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="regForm.email" placeholder="用于找回密码（可选）" size="large" />
        </el-form-item>

        <el-button type="success" class="w-100 reg-btn" @click="handleRegister" :loading="loading" size="large">
          注 册 账 户
        </el-button>

        <div class="login-link">
          <span>已有专属账号？</span>
          <el-link type="primary" :underline="false" @click="router.push('/login')">返回登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// ... 这里保留你原本的 script 逻辑，不需要任何改动 ...
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const regFormRef = ref()
const loading = ref(false)

const regForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: ''
})

const rules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, message: '用户名至少3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== regForm.password) callback(new Error('两次输入密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

const handleRegister = async () => {
  await regFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await request.post('/api/customer/register', {
        username: regForm.username,
        password: regForm.password,
        phone: regForm.phone,
        email: regForm.email
      })
      if (res.success) {
        ElMessage.success('注册成功！')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      ElMessage.error('注册异常，请稍后再试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
/* 1. 背景保持一致：明亮湖蓝渐变 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* 背景光晕装饰 */
.bg-decoration {
  position: absolute;
  width: 50vw;
  height: 50vw;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  top: -10%;
  left: -5%;
  filter: blur(100px);
}

/* 2. 卡片优化：与登录页呼应的悬浮感 */
.register-card {
  width: 480px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: none;
  box-shadow: 0 20px 50px rgba(31, 76, 107, 0.15);
  padding: 10px;
}

/* 3. 头部标题样式 */
.card-header {
  text-align: center;
  padding: 10px 0;
}

.logo-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #67C23A, #95d475);
  border-radius: 12px;
  margin: 0 auto 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 5px 15px rgba(103, 194, 58, 0.3);
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  letter-spacing: 1px;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 13px;
  color: #909399;
}

/* 4. 表单内部布局优化 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #606266;
  padding-bottom: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02) inset;
  transition: all 0.3s;
}

/* 5. 按钮优化：与主题呼应的渐变色 */
.w-100 {
  width: 100%;
  margin-top: 15px;
}

.reg-btn {
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(90deg, #67C23A 0%, #4facfe 100%) !important;
  border: none;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.2);
  transition: all 0.3s;
}

.reg-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(103, 194, 58, 0.3);
}

/* 6. 底部链接 */
.login-link {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
