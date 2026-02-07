<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>完善个人资料</span>
        </div>
      </template>

      <el-form :model="userForm" label-width="100px" v-loading="loading">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>

        <el-form-item label="真实姓名">
          <el-input v-model="userForm.realName" placeholder="请填写真实姓名" />
        </el-form-item>

        <el-form-item label="联系电话">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="常用车型">
          <el-input v-model="userForm.carModel" placeholder="例如：奥迪Q7" />
        </el-form-item>

        <el-form-item label="车牌号码">
          <el-input v-model="userForm.carLicense" placeholder="例如：京A·88888" />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="userForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="电子邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleUpdate" :loading="updating">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const updating = ref(false)

// 性别反向映射表：数据库文字 -> 前端数字
const genderTextToNum = {
  '未知': 0,
  '男': 1,
  '女': 2
}

const userForm = reactive({
  id: null,
  username: '',
  realName: '',
  phone: '',
  carModel: '',
  carLicense: '',
  gender: 0,
  email: ''
})

// 加载初始数据
const loadUserData = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return

  const user = JSON.parse(userStr)
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/customer/${user.id}`)
    if (res.data.success || res.data.code === 200) {
      const dbData = res.data.data

      // 将数据库存的字符串 "男"/"女" 转回前端用的数字 1/2
      if (typeof dbData.gender === 'string') {
        dbData.gender = genderTextToNum[dbData.gender] || 0
      }

      Object.assign(userForm, dbData)
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 提交修改
const handleUpdate = async () => {
  updating.value = true
  try {
    const res = await axios.put('http://localhost:8080/api/customer/update', userForm)

    if (res.data.success || res.data.code === 200) {
      ElMessage.success('个人信息更新成功！')

      // 【核心修复】获取旧的用户信息，并与后端返回的新信息合并
      const oldUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedDataFromBackend = res.data.data

      // 合并数据，确保 role 等权限字段不丢失
      const newUser = { ...oldUser, ...updatedDataFromBackend }
      localStorage.setItem('user', JSON.stringify(newUser))

    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('网络请求失败')
  } finally {
    updating.value = false
  }
}

onMounted(loadUserData)
</script>

<style scoped>
.profile-container { padding: 30px; display: flex; justify-content: center; background-color: #f5f7fa; min-height: 80vh; }
.profile-card { width: 550px; border-radius: 12px; }
.card-header { font-weight: bold; font-size: 18px; color: #409eff; text-align: center; }
</style>
