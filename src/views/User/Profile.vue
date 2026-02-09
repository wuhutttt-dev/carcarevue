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

        <el-form-item label="车辆类型">
          <el-radio-group v-model="userForm.vehicleType" disabled>
            <el-radio value="燃油车">燃油车</el-radio>
            <el-radio value="电车">电车 (新能源)</el-radio>
          </el-radio-group>
          <div class="form-tip">系统将根据车牌号位数自动识别 (7位油车, 8位电车)</div>
        </el-form-item>

        <el-form-item label="车牌号码">
          <el-input v-model="userForm.carLicense" placeholder="例如：川A·88888" />
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
import { reactive, onMounted, ref, watch } from 'vue' // 确保导入了 watch
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const updating = ref(false)

// 性别反向映射表：数据库文字 -> 前端数字 (保持你的逻辑不变)
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
  email: '',
  vehicleType: ''
})

/**
 * 【核心逻辑】监听车牌号变化，自动识别车型
 * 7位识别为燃油车，8位识别为电车
 */
watch(() => userForm.carLicense, (newVal) => {
  if (!newVal) {
    userForm.vehicleType = ''
    return
  }

  // 过滤掉车牌中的空格、中划线、点号等非文字字符
  const cleanPlate = newVal.replace(/[-·\s]/g, '')

  if (cleanPlate.length === 7) {
    userForm.vehicleType = '燃油车'
  } else if (cleanPlate.length === 8) {
    userForm.vehicleType = '电车'
  } else {
    userForm.vehicleType = '' // 位数不对时不标记
  }
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

      // 【性别转换逻辑】将数据库存的字符串 "男"/"女" 转回前端用的数字 1/2 (保持不变)
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
  // 提交前校验，确保识别到了车型
  if (!userForm.vehicleType && userForm.carLicense) {
    const cleanPlate = userForm.carLicense.replace(/[-·\s]/g, '')
    if (cleanPlate.length !== 7 && cleanPlate.length !== 8) {
        ElMessage.warning('请输入正确的车牌号（7位或8位）')
        return
    }
  }

  updating.value = true
  try {
    // 发送包含 vehicleType 的 userForm 对象到后端
    const res = await axios.put('http://localhost:8080/api/customer/update', userForm)

    if (res.data.success || res.data.code === 200) {
      ElMessage.success('个人信息更新成功！')

      // 获取旧的用户信息并合并，防止权限等信息丢失
      const oldUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedDataFromBackend = res.data.data

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
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
