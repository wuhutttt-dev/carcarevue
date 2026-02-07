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
          placeholder="请选择项目（支持多选）"
          style="width: 100%"
          v-loading="loadingServices"
          multiple
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in serviceOptions"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          >
            <span class="option-name">{{ item.name }}</span>
            <span class="option-price">¥{{ item.price }}</span>
          </el-option>
        </el-select>
        <div v-if="discountTip" class="discount-hint">
          <el-icon><MagicStick /></el-icon> {{ discountTip }}
        </div>
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
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, InfoFilled } from '@element-plus/icons-vue'

// --- 基础状态与路由 ---
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingServices = ref(false)
const serviceOptions = ref([])

const form = reactive({
  carModel: '',
  serviceType: [],
  appointmentTime: '',
  remark: ''
})

// --- 实时计价与复合折扣逻辑 ---
const billing = computed(() => {
  let carWrapPrice = 0
  let extraServicesPrice = 0
  let totalDuration = 0
  let hasCarWrap = false

  form.serviceType.forEach(name => {
    const item = serviceOptions.value.find(s => s.name === name)
    if (item) {
      totalDuration += item.duration
      if (name === '贴车衣') {
        hasCarWrap = true
        carWrapPrice = item.price
      } else {
        extraServicesPrice += item.price
      }
    }
  })

  const extraCount = hasCarWrap ? form.serviceType.length - 1 : form.serviceType.length
  let finalPrice = 0
  let discountAmount = 0
  let rateName = '无折扣'

  if (hasCarWrap) {
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

    finalPrice = (carWrapPrice * carWrapRate) + (extraServicesPrice * extraServiceRate)
    discountAmount = (carWrapPrice + extraServicesPrice) - finalPrice
  } else {
    let commonRate = 1
    if (extraCount === 2) { commonRate = 0.95; rateName = '95折' }
    else if (extraCount === 3) { commonRate = 0.88; rateName = '88折' }
    else if (extraCount >= 4) { commonRate = 0.75; rateName = '75折' }

    finalPrice = extraServicesPrice * commonRate
    discountAmount = extraServicesPrice - finalPrice
  }

  return {
    totalPrice: carWrapPrice + extraServicesPrice,
    totalDuration: totalDuration,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
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
    const res = await axios.get('http://localhost:8080/api/service-item/list')
    if (res.data.success || res.data.code === 200) {
      serviceOptions.value = res.data.data
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
      status: '待确认'
    }
    const res = await axios.post('http://localhost:8080/api/appointment/add', payload)
    if (res.data.success || res.data.code === 200) {
      ElMessage.success('预约成功！')
      reset()
    }
  } catch (error) {
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
