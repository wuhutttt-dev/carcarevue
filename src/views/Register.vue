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

// 表单校验规则
const rules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
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
  phone: [{ required: true, message: '手机号不能为空', trigger: 'blur' }]
}

const handleRegister = async () => {
  // 校验表单
  await regFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await request.post('/api/customer/register', {
        username: regForm.username,
        password: regForm.password,
        phone: regForm.phone
      })

      if (res.success) {
        ElMessage.success('注册成功！正在跳转登录...')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      ElMessage.error('网络错误，注册失败')
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
