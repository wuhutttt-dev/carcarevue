<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span>顾客账户注册</span>
        </div>
      </template>

      <el-form :model="regForm" :rules="rules" ref="regFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="regForm.username" placeholder="建议使用手机号或英文" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="regForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="regForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="regForm.phone" placeholder="用于接收保养通知" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="regForm.email" placeholder="用于找回密码" />
        </el-form-item>

        <el-button type="success" class="w-100" @click="handleRegister" :loading="loading">
          立即注册
        </el-button>

        <div class="login-link">
          <span>已有账号？</span>
          <el-link type="primary" @click="router.push('/login')">返回登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
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
  phone: ''
})

const phoneReg = /^1[3-9]\d{9}$/;
const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

// 表单校验规则
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
        email: regForm.email // 确保这里传递了 email
      })

      if (res.success) {
        ElMessage.success('注册成功！')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        // 这里会自动捕获后端 Service 抛出的 "该用户名已被注册"
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
}
.register-card { width: 450px; border-radius: 15px; }
.card-header { text-align: center; font-weight: bold; font-size: 20px; color: #67C23A; }
.w-100 { width: 100%; margin-top: 10px; }
.login-link { text-align: center; margin-top: 20px; font-size: 14px; }
</style>
