<template>
  <el-card class="order-card" shadow="never">
    <template #header>
      <div class="header-box">
        <div class="title-area">
          <el-icon><List /></el-icon>
          <span class="title">预约订单处理中心</span>
        </div>
        <el-button type="primary" icon="Refresh" @click="fetchOrders" :loading="loading">刷新数据</el-button>
      </div>
    </template>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索客户姓名..."
        style="width: 300px;"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <el-table :data="filteredOrders" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="appointmentTime" label="预约时间" width="180" sortable />
      <el-table-column prop="customerName" label="客户姓名" width="120" />
      <el-table-column prop="carModel" label="车型" width="150" />
      <el-table-column prop="serviceType" label="服务项目" min-width="200" />

      <el-table-column label="实付金额" width="120">
        <template #default="scope">
          <span class="price-tag">¥{{ scope.row.finalPrice }}</span>
        </template>
      </el-table-column>

      <el-table-column label="订单状态" width="120">
        <template #default="scope">
          <el-tag :type="statusMap[scope.row.status]">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="cancelReason" label="取消原因" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.status === '已取消' && scope.row.cancelReason">
            {{ scope.row.cancelReason }}
          </span>
          <span v-else style="color: #c0c4cc;">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="workerName" label="负责技师" width="120">
        <template #default="scope">
          <span>{{ scope.row.workerName || '未分配' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            icon="Edit"
            @click="openEditDialog(scope.row)"
            v-if="scope.row.status === '待确认'"
          >修改项目</el-button>

          <el-button
            v-if="scope.row.status === '待确认'"
            type="success"
            size="small"
            @click="handleUpdate(scope.row.id, '已确认')"
          >确认订单</el-button>

          <el-button
            v-if="scope.row.status === '待确认'"
            type="danger"
            size="small"
            @click="handleUpdate(scope.row.id, '已取消')"
          >拒绝</el-button>

          <span v-else-if="scope.row.status === '已确认'" style="color: #909399; font-size: 12px;">
            等待技师抢单...
          </span>
          <span v-else style="color: #909399; font-size: 12px;">已处理完毕</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editDialogVisible" title="修改订单服务内容" width="650px">
      <el-form :model="editingOrder" label-width="120px">
        <el-form-item label="客户姓名">
          <el-input v-model="editingOrder.customerName" disabled />
        </el-form-item>

        <el-form-item label="选择服务项目">
          <el-select
            v-model="editingOrder.serviceTypeList"
            multiple
            collapse-tags
            placeholder="请选择服务项目"
            style="width: 100%"
            @change="reCalculatePrice"
          >
            <el-option
              v-for="item in allServices"
              :key="item.id"
              :label="item.name"
              :value="item.name"
            >
              <span style="float: left">{{ item.name }}</span>
              <span style="float: right; color: #f56c6c; font-size: 13px">¥{{ item.price }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-divider content-position="left">费用明细</el-divider>

        <el-form-item label="项目累计总价">
          <span style="color: #909399; text-decoration: line-through;">
            ¥ {{ systemCalculated.totalPrice.toFixed(2) }}
          </span>
        </el-form-item>

        <el-form-item label="系统优惠价">
          <el-tag type="success" effect="plain" style="font-size: 14px; font-weight: bold;">
            ¥ {{ systemCalculated.discountedPrice.toFixed(2) }}
          </el-tag>
          <span style="margin-left: 10px; color: #67c23a; font-size: 12px;">
            (已自动应用阶梯折扣逻辑)
          </span>
        </el-form-item>

        <el-form-item label="最终实付金额">
          <el-input-number
            v-model="editingOrder.finalPrice"
            :precision="2"
            :step="1"
            :min="0"
            size="large"
            style="width: 200px"
          />
          <div class="tip" style="color: #f56c6c; font-size: 12px; margin-top: 5px;">
            <el-icon style="vertical-align: middle"><InfoFilled /></el-icon>
            管理员可在此处手动进行抹零或微调价格
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit" :loading="editLoading">保存修改并确认</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { List, Search, Refresh, InfoFilled } from '@element-plus/icons-vue'

const orderList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const allServices = ref([])

const statusMap = {
  '待确认': 'info',
  '已确认': 'primary',
  '服务中': 'success',
  '已完成': 'warning',
  '已取消': 'danger'
}

// 编辑弹窗相关的状态
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editingOrder = ref({
  id: null,
  customerName: '',
  serviceTypeList: [],
  finalPrice: 0,
  totalPrice: 0,
  discount: 0
})

// 系统自动计算的结果（只读展示）
const systemCalculated = reactive({
  totalPrice: 0,
  discountedPrice: 0
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/appointment/listAll')
    if (res.success) orderList.value = res.data
  } catch (error) {
    ElMessage.error('无法连接到后端服务器')
  } finally {
    loading.value = false
  }
}

const fetchAllServices = async () => {
  const res = await request.get('/api/service-item/list')
  if (res.success) allServices.value = res.data
}

/**
 * 核心计价算法（复刻 Appointments.vue 的折扣规则）
 */
const reCalculatePrice = () => {
  let repairPrice = 0
  let carWrapPrice = 0
  let beautyPrice = 0
  let beautyCount = 0
  let hasCarWrap = false
  let totalDuration = 0 // 新增：用于累加时长

  editingOrder.value.serviceTypeList.forEach(name => {
    const item = allServices.value.find(s => s.name === name)
    if (item) {
      const price = item.price || 0
      totalDuration += (item.duration || 0) // 累加每个服务的时长
      if (item.category === 'repair' || item.category === '维修') {
        repairPrice += price
      } else {
        if (name === '贴车衣') {
          hasCarWrap = true
          carWrapPrice = price
        } else {
          beautyPrice += price
          beautyCount++
        }
      }
    }
  })

  // 折扣逻辑
  let discountedWrap = carWrapPrice
  let discountedBeauty = beautyPrice

  if (hasCarWrap) {
    let wrapRate = 1; let bRate = 1
    if (beautyCount === 1) wrapRate = 0.99
    else if (beautyCount === 2) { wrapRate = 0.97; bRate = 0.95 }
    else if (beautyCount === 3) { wrapRate = 0.95; bRate = 0.88 }
    else if (beautyCount >= 4) { wrapRate = 0.92; bRate = 0.75 }
    discountedWrap = carWrapPrice * wrapRate
    discountedBeauty = beautyPrice * bRate
  } else {
    let commonRate = 1
    if (beautyCount === 2) commonRate = 0.95
    else if (beautyCount === 3) commonRate = 0.88
    else if (beautyCount >= 4) commonRate = 0.75
    discountedBeauty = beautyPrice * commonRate
  }

  // 把计算出来的总时长存入 editingOrder
  editingOrder.value.expectedTime = totalDuration.toString()

  systemCalculated.totalPrice = repairPrice + carWrapPrice + beautyPrice
  systemCalculated.discountedPrice = repairPrice + discountedWrap + discountedBeauty

  // 默认填充最终价格，管理员可改
  editingOrder.value.finalPrice = Math.round(systemCalculated.discountedPrice * 100) / 100
}

const openEditDialog = (row) => {
  editingOrder.value = {
    id: row.id,
    customerName: row.customerName,
    serviceTypeList: row.serviceType ? row.serviceType.split(',') : [],
    finalPrice: row.finalPrice || 0
  }
  if (allServices.value.length === 0) fetchAllServices()
  // 首次打开先跑一遍计价
  setTimeout(() => reCalculatePrice(), 100)
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  editLoading.value = true
  try {
    const params = {
      id: editingOrder.value.id,
      serviceType: editingOrder.value.serviceTypeList.join(','),
      expectedTime: editingOrder.value.expectedTime, // 发送预计耗时
      totalPrice: systemCalculated.totalPrice,
      finalPrice: editingOrder.value.finalPrice, // 提交管理员修改后的金额
      discount: systemCalculated.totalPrice - editingOrder.value.finalPrice,
      status: '已确认', // 修改完顺便帮管理员确认订单
      workerId: 0,
      workerName: ''
    }
    const res = await request.post('/api/appointment/updateStatus', params)
    if (res.success) {
      ElMessage.success('订单已修改并确认')
      editDialogVisible.value = false
      fetchOrders()
    }
  } finally {
    editLoading.value = false
  }
}

const handleUpdate = async (id, nextStatus) => {
  try {
    const params = { id, status: nextStatus, workerId: 0, workerName: '' }
    const res = await request.post('/api/appointment/updateStatus', params)
    if (res.success) {
      ElMessage.success(`订单状态已更新`)
      fetchOrders()
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const filteredOrders = computed(() => {
  if (!searchQuery.value) return orderList.value
  const q = searchQuery.value.toLowerCase()
  return orderList.value.filter(order =>
    (order.customerName && order.customerName.toLowerCase().includes(q)) ||
    (order.carModel && order.carModel.toLowerCase().includes(q))
  )
})

onMounted(fetchOrders)
</script>

<style scoped>
.order-card { margin: 20px; border-radius: 8px; }
.header-box { display: flex; justify-content: space-between; align-items: center; }
.title-area { display: flex; align-items: center; gap: 10px; }
.title { font-size: 18px; font-weight: bold; }
.search-bar { margin-bottom: 20px; }
.price-tag { color: #f56c6c; font-weight: bold; }
</style>
