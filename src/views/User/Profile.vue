<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>完善个人资料</span>
        </div>
      </template>

      <el-form
        :model="userForm"
        :rules="rules"
        ref="profileFormRef"
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请填写真实姓名" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="车牌号码" prop="carLicense">
          <el-input v-model="userForm.carLicense" placeholder="例如：川A·88888" />
        </el-form-item>

        <el-form-item label="常用车型" prop="carModel">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-select
              v-model="selectedBrand"
              placeholder="选择品牌"
              style="width: 150px"
              @change="handleBrandChange"
            >
              <el-option
                v-for="brand in brandList"
                :key="brand"
                :label="brand"
                :value="brand"
              />
            </el-select>

            <el-select
              v-model="userForm.carModel"
              filterable
              remote
              :placeholder="selectedBrand ? `在${selectedBrand}中搜索` : '请先选择品牌'"
              :remote-method="remoteSearchCar"
              @focus="() => remoteSearchCar('')"
              :loading="searchLoading"
              :disabled="!selectedBrand"
              style="flex: 1"
            >
              <el-option
                v-for="item in carOptions"
                :key="item.id"
                :label="item.modelName"
                :value="item.modelName"
              />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item label="车辆类型">
          <el-radio-group v-model="userForm.vehicleType" disabled>
            <el-radio value="燃油车">燃油车</el-radio>
            <el-radio value="电车">电车 (新能源)</el-radio>
          </el-radio-group>
          <div class="form-tip">系统将根据车牌号位数自动识别 (7位油车, 8位电车)</div>
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="userForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
            <el-radio value="未知">未知</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="电子邮箱" prop="email">
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
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const updating = ref(false)
const profileFormRef = ref(null) // 表单引用
const searchLoading = ref(false)
const carOptions = ref([])
const selectedBrand = ref('') // 选中的品牌
const brandList = ref([])


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

// 校验规则定义
const rules = {
  realName: [{ required: true, message: '请填写真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '联系电话不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  carModel: [{ required: true, message: '请填写常用车型', trigger: 'blur' }],
  carLicense: [
    { required: true, message: '车牌号码不能为空', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const cleanPlate = value.replace(/[-·\s]/g, '')
        if (cleanPlate.length !== 7 && cleanPlate.length !== 8) {
          callback(new Error('车牌号长度需为7位(蓝/黄牌)或8位(绿牌)'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}



/**
 * 【核心逻辑】监听车牌号变化，自动识别车型
 * 7位识别为燃油车，8位识别为电车
 */
/**
 * 修改：监听车牌号变化，自动识别车型，并联动刷新品牌列表
 */
watch(() => userForm.carLicense, (newVal) => {
  if (!newVal) {
    if (userForm.vehicleType !== '') {
      userForm.vehicleType = ''
      loadBrands() // 车牌为空时，加载所有品牌
    }
    return
  }

  const cleanPlate = newVal.replace(/[-·\s]/g, '')
  let newType = ''

  if (cleanPlate.length === 7) {
    newType = '燃油车'
  } else if (cleanPlate.length === 8) {
    newType = '电车'
  }

  // 只有当类型真正发生变化时，才去清空数据和重新请求后端
  if (newType !== '' && userForm.vehicleType !== newType) {
    userForm.vehicleType = newType

    // 如果用户是在修改车牌导致类型变化，清空之前的品牌和车型选择，防止冲突
    selectedBrand.value = ''
    userForm.carModel = ''
    carOptions.value = []

    // 重新根据新类型请求品牌库
    loadBrands(newType)
  }
})

// 加载初始数据
// 修改：加载初始数据
const loadUserData = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return

  const user = JSON.parse(userStr)
  loading.value = true
  try {
    const res = await request.get(`/api/customer/${user.id}`)
    if (res.success || res.code === 200) {
      const dbData = res.data
      Object.assign(userForm, dbData)

      // 如果后端返回了车辆，提取车牌判断类型并加载对应品牌
      if (dbData.carLicense) {
         const cleanPlate = dbData.carLicense.replace(/[-·\s]/g, '')
         if (cleanPlate.length === 7) loadBrands('燃油车')
         else if (cleanPlate.length === 8) loadBrands('电车')
         else loadBrands()
      } else {
         loadBrands()
      }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

/**
 * 修改：支持按车辆类型加载品牌数据
 */
const loadBrands = async (vType = '') => {
  try {
    const params = {}
    if (vType) {
      params.vehicleType = vType // 传递给后端的参数
    }

    const res = await request.get('/api/customer/cars/brands', { params });
    if (res.success) {
      brandList.value = res.data;
    }
  } catch (e) {
    console.error('加载品牌失败', e);
  }
}

/**
 * 远程搜索车型方法
 * @param query 用户输入的关键词
 */
const remoteSearchCar = async (query) => {
  // 核心逻辑：只要选了品牌，就可以进行查询（query 为空则查全品牌）
  if (selectedBrand.value) {
    searchLoading.value = true
    try {
      const res = await request.get('/api/customer/searchCarModels', {
        params: {
          brand: selectedBrand.value,
          keyword: query // query 可能为空字符串
        }
      })
      if (res.success) {
        carOptions.value = res.data
      }
    } catch (e) {
      console.error('搜索车型库失败', e)
    } finally {
      searchLoading.value = false
    }
  } else {
    carOptions.value = []
  }
}

// 品牌切换时清空车型
const handleBrandChange = () => {
  userForm.carModel = '';
  carOptions.value = [];
  // 切换品牌后，立即预加载该品牌下的车型列表，方便用户直接点击下拉框选择
  remoteSearchCar('');
}

// 提交修改
const handleUpdate = async () => {
  if (!profileFormRef.value) return

  // 1. 触发前端表单验证
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return

    updating.value = true
    try {
      // 2. 发送请求
      const res = await request.post('/api/customer/updateProfile', userForm)
      if (res.success) {
        ElMessage.success('个人信息更新成功！')
        // 更新本地缓存
        const oldUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...oldUser, ...res.data }))
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } catch (e) {
      ElMessage.error('网络请求失败')
    } finally {
      updating.value = false
    }
  })
}

onMounted(() => {
  loadUserData(); // 原有的加载用户信息
  // 注意：这里去掉了原来单独调用的 loadBrands()
  // 因为 loadUserData 中已经根据获取到的车牌号情况去调用 loadBrands 了，避免重复请求
})
</script>

<style scoped>
.profile-container { padding: 30px; display: flex; justify-content: center; background-color: #f5f7fa; min-height: 80vh; }
.profile-card { width: 550px; border-radius: 12px; }
.card-header { font-weight: bold; font-size: 18px; color: #409eff; text-align: center; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
