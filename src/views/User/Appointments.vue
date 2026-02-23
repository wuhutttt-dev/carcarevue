<template>
  <el-card class="appointment-card">
    <template #header>
      <div class="card-header">
        <span>预约汽车保养服务</span>
      </div>
    </template>

    <el-form :model="form" label-width="100px" class="form-body">
      <el-form-item label="车辆型号">
        <el-input v-model="form.carModel" placeholder="例如：奥迪Q7" />
      </el-form-item>

      <el-form-item label="服务项目">
        <el-select
          v-model="form.serviceType"
          placeholder="请选择项目（已为您匹配适用项目）"
          style="width: 100%"
          v-loading="loadingServices"
          multiple
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in filteredServiceOptions"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          >
            <span class="option-name">{{ item.name }}</span>
            <el-tag size="small" effect="plain" style="margin-left: 8px">{{ item.vehicleType }}</el-tag>
            <span class="option-price">¥{{ item.price }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="预约时间">
        <el-date-picker
          v-model="form.appointmentTime"
          type="datetime"
          placeholder="选择日期和时间"
          style="width: 100%"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <div v-if="overnightTip" class="overnight-alert">
          <el-icon><InfoFilled /></el-icon> {{ overnightTip }}
        </div>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="如有特殊需求请备注"
        />
      </el-form-item>

      <div v-if="form.serviceType.length > 0" class="checkout-panel">
        <div class="checkout-row">
          <div class="checkout-left">
            <div class="stat-item">
              已选项目：<span>{{ form.serviceType.length }} 项</span>
            </div>
            <div class="stat-item">
              预计总耗时：<span>{{ billing.totalDuration }} 分钟</span>
            </div>
            <div v-if="estimatedPickupTime" class="stat-item pickup-time">
              预计取车：<span>{{ estimatedPickupTime }}</span>
            </div>
          </div>

          <div class="checkout-right">
            <div class="price-line">
              <span>合计：</span>
              <span>¥{{ billing.totalPrice.toFixed(2) }}</span>
            </div>
            <div v-if="billing.discountAmount > 0" class="price-line discount-text">
              <span>折扣优惠 ({{ billing.rateName }})：</span>
              <span>- ¥{{ billing.discountAmount.toFixed(2) }}</span>
            </div>
            <div class="final-line">
              <span class="label">预计应付：</span>
              <span class="amount">¥{{ billing.finalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <el-button
          type="primary"
          @click="submit"
          :loading="loading"
          size="large"
          class="submit-btn"
        >
          提交预约
        </el-button>
        <el-button @click="reset" size="large">重置</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, InfoFilled } from '@element-plus/icons-vue'

// --- 基础状态与路由 ---
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingServices = ref(false)
const serviceOptions = ref([])
const userVehicleType = ref('') // [新增] 用于存储当前用户的车型

const form = reactive({
  carModel: '',
  serviceType: [],
  appointmentTime: '',
  remark: ''
})

// --- [核心功能新增] 计算过滤后的服务列表 ---
const filteredServiceOptions = computed(() => {
  const userType = (userVehicleType.value || '').trim()

  // 如果没有识别到车型，为了兼容性显示全量数据
  if (!userType) return serviceOptions.value

  return serviceOptions.value.filter(item => {
    // 根据您数据库截图，字段名为 vehicleType
    const itemType = (item.vehicleType || '').trim()
    // 实现逻辑：匹配用户车型 OR 通用项目 OR 字段为空
    return itemType === userType || itemType === '通用' || itemType === ''
  })
})

// --- 实时计价与复合折扣逻辑 ---
const billing = computed(() => {
  // === 1. 定义变量 ===
  let carWrapPrice = 0       // 车衣原价
  let beautyServicesPrice = 0 // 美容/保养项目原价（原 extraServicesPrice）
  let repairPrice = 0        // 维修项目原价（新增：完全不参与打折）

  let totalDuration = 0
  let hasCarWrap = false
  let beautyCount = 0        // 参与打折的项目数量（原 extraCount）

  // === 2. 遍历并分类 ===
  form.serviceType.forEach(name => {
    const item = serviceOptions.value.find(s => s.name === name)
    if (item) {
      totalDuration += (item.duration || 0)

      // 判断是否为维修项目 (根据你数据库的 category 字段值调整，如 'repair' 或 '维修')
      if (item.category === 'repair' || item.category === '维修') {
        // A. 维修项目：全额累加，不计数，不参与折扣
        repairPrice += item.price
      } else {
        // B. 非维修项目（车衣或美容保养）
        if (name === '贴车衣') {
          hasCarWrap = true
          carWrapPrice = item.price
        } else {
          beautyServicesPrice += item.price
          beautyCount++ // 只有美容项目才计入“凑单数量”
        }
      }
    }
  })

  // === 3. 计算折扣 (逻辑保持你原有的不变，只是变量名换了) ===
  // 注意：这里的 extraCount 现在只代表“除车衣外的美容项目数量”，维修项目不充当分母
  const extraCount = beautyCount

  let discountedWrapPrice = carWrapPrice // 默认车衣实付
  let discountedBeautyPrice = beautyServicesPrice // 默认美容实付
  let rateName = '无折扣'

  if (hasCarWrap) {
    // --- 场景一：有车衣 ---
    let carWrapRate = 1
    let extraServiceRate = 1

    if (extraCount === 1) {
      carWrapRate = 0.99
      extraServiceRate = 1
      rateName = '车衣99折'
    } else if (extraCount === 2) {
      carWrapRate = 0.97
      extraServiceRate = 0.95
      rateName = '车衣97折+额外95折'
    } else if (extraCount === 3) {
      carWrapRate = 0.95
      extraServiceRate = 0.88
      rateName = '车衣95折+额外88折'
    } else if (extraCount >= 4) {
      carWrapRate = 0.92
      extraServiceRate = 0.75
      rateName = '车衣92折+额外75折'
    }

    discountedWrapPrice = carWrapPrice * carWrapRate
    discountedBeautyPrice = beautyServicesPrice * extraServiceRate

  } else {
    // --- 场景二：无车衣 (纯美容/保养凑单) ---
    let commonRate = 1
    if (extraCount === 2) { commonRate = 0.95; rateName = '95折' }
    else if (extraCount === 3) { commonRate = 0.88; rateName = '88折' }
    else if (extraCount >= 4) { commonRate = 0.75; rateName = '75折' }

    discountedBeautyPrice = beautyServicesPrice * commonRate
  }

  // === 4. 汇总最终价格 ===
  // 最终价 = 维修原价 + 打折后的车衣 + 打折后的美容
  const finalPriceCalc = repairPrice + discountedWrapPrice + discountedBeautyPrice

  // 原总价
  const totalPriceCalc = repairPrice + carWrapPrice + beautyServicesPrice

  // 优惠金额
  const discountAmount = totalPriceCalc - finalPriceCalc

  // 如果有维修项目且产生了折扣，提示语加个备注
  if (repairPrice > 0 && discountAmount > 0) {
    rateName += ' (维修不打折)'
  }

  return {
    totalPrice: totalPriceCalc,
    totalDuration: totalDuration,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPriceCalc * 100) / 100,
    rateName: rateName
  }
})

// --- 时间计算属性 ---
const estimatedPickupTime = computed(() => {
  if (!form.appointmentTime || billing.value.totalDuration === 0) return ''

  const startTime = new Date(form.appointmentTime.replace(/-/g, '/'))
  const endTime = new Date(startTime.getTime() + billing.value.totalDuration * 60000)

  const y = endTime.getFullYear()
  const m = String(endTime.getMonth() + 1).padStart(2, '0')
  const d = String(endTime.getDate()).padStart(2, '0')
  const hh = String(endTime.getHours()).padStart(2, '0')
  const mm = String(endTime.getMinutes()).padStart(2, '0')

  return `${y}-${m}-${d} ${hh}:${mm}`
})

const overnightTip = computed(() => {
  const isOvernight = billing.value.totalDuration >= 480
  if (isOvernight && form.appointmentTime) {
    return '📢 温馨提示：项目耗时较长（含贴车衣等），车辆需留店过夜，请提前安排出行。'
  }
  return ''
})

const discountTip = computed(() => {
  const count = form.serviceType.length
  const hasCarWrap = form.serviceType.includes('贴车衣')

  if (hasCarWrap) {
    if (count === 1) return '再加购 1 项服务，贴车衣立享 99 折！'
    if (count === 2) return '已激活：贴车衣 99 折！再加 1 项可享车衣 97 折 + 额外 95 折！'
    if (count === 3) return '已激活：车衣 97 折 + 额外 95 折！再加 1 项享更高折扣！'
    return `已激活车衣专项顶级折扣：${billing.value.rateName}`
  }

  if (count === 1) return '多选 1 项可享 95 折优惠！'
  return count >= 2 ? `已激活通用阶梯折扣：${billing.value.rateName}` : ''
})

// --- 业务方法 ---
const loadServices = async () => {
  loadingServices.value = true
  try {
    const res = await request.get('/api/service-item/list')
    if (res.success || res.code === 200) {
      serviceOptions.value = res.data
    }
  } catch (e) {
    ElMessage.error('加载服务失败')
  } finally {
    loadingServices.value = false
  }
}

const submit = async () => {
  const userStr = localStorage.getItem('user')
  const user = JSON.parse(userStr)

  if (!form.carModel || form.serviceType.length === 0 || !form.appointmentTime) {
    ElMessage.warning('请补全预约必填信息')
    return
  }

  loading.value = true
  try {
    const payload = {
      ...form,
      serviceType: form.serviceType.join(','),
      customerId: user.id,
      customerName: user.realName,
      customerPhone: user.phone,
      carLicense: user.carLicense,
      vehicleType: userVehicleType.value,
      status: '待确认',

      totalPrice: billing.value.totalPrice,
      finalPrice: billing.value.finalPrice,
      discount: billing.value.discountAmount
    }
    const res = await request.post('/api/appointment/add', payload)
    if (res.success || res.code === 200) {
      ElMessage.success('预约成功！')
      reset()
    } else {
      // 【补充】如果后端返回失败（如名额已满），需要给出提示
      ElMessage.error(res.message || '预约失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('无法连接到服务器')
  } finally {
    loading.value = false
  }
}

const reset = () => {
  form.carModel = ''
  form.serviceType = []
  form.appointmentTime = ''
  form.remark = ''
}

// --- 生命周期 ---
onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const user = JSON.parse(userStr)
  userVehicleType.value = user.vehicleType || ''
  const isIncomplete = !user.realName || !user.phone || !user.carModel

  if (isIncomplete) {
    ElMessageBox.alert(
      '您的个人资料尚不完整。为了确保预约有效，请先补全信息。',
      '预约前置提醒',
      {
        confirmButtonText: '去完善资料',
        showClose: false,
        closeOnClickModal: false,
        callback: () => {
          router.push('/user/profile')
        }
      }
    )
    return
  }

  if (user.carModel) form.carModel = user.carModel
  loadServices().then(() => {
    if (route.query.selectedService) {
      form.serviceType = [route.query.selectedService]
    }
  })
})
</script>

<style scoped>
/* 容器与卡片 */
.appointment-card {
  max-width: 700px;
  margin: 30px auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.card-header {
  font-weight: bold;
  color: #409eff;
  font-size: 18px;
  text-align: center;
}
.form-body {
  padding: 10px 10px;
}

/* 选项样式 */
.option-name {
  float: left;
}
.option-price {
  float: right;
  color: #f56c6c;
  font-size: 13px;
}

/* 警示与提醒 */
.overnight-alert {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #fde2e2;
}
.discount-hint {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 结算面板 */
.checkout-panel {
  margin: 25px 0;
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.checkout-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

/* 统计项 */
.stat-item {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-item span {
  color: #303133;
  font-weight: 500;
  margin-left: 5px;
}
.pickup-time span {
  color: #409eff;
  font-weight: bold;
}

/* 价格面板 */
.checkout-right {
  text-align: right;
}
.price-line {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}
.discount-text {
  color: #f56c6c;
  font-weight: bold;
}
.final-line {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #dcdfe6;
}
.final-line .label {
  font-size: 14px;
  color: #303133;
}
.final-line .amount {
  font-size: 26px;
  font-weight: bold;
  color: #f56c6c;
  margin-left: 8px;
}

/* 按钮组 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
.submit-btn {
  width: 180px;
}
</style>
