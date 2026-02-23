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

      <el-table-column prop="workerName" label="负责技师" width="120">
        <template #default="scope">
          <span>{{ scope.row.workerName || '未分配' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
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
          >拒绝预约</el-button>

          <span v-else-if="scope.row.status === '已确认'" style="color: #909399; font-size: 12px;">
            等待技师抢单...
          </span>
          <span v-else style="color: #909399; font-size: 12px;">已处理完毕</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { List, Search, Refresh } from '@element-plus/icons-vue'

const orderList = ref([])
const loading = ref(false)
const searchQuery = ref('')

const statusMap = {
  '待确认': 'info',
  '已确认': 'primary',
  '服务中': 'success',
  '已完成': 'warning',
  '已取消': 'danger'
}

/**
 * 获取所有订单
 */
const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/appointment/listAll')
    if (res.success) {
      orderList.value = res.data
    } else {
      ElMessage.error(res.message || '数据加载失败')
    }
  } catch (error) {
    console.error('Fetch Error:', error)
    ElMessage.error('无法连接到后端服务器')
  } finally {
    loading.value = false
  }
}

/**
 * 搜索过滤
 */
const filteredOrders = computed(() => {
  if (!searchQuery.value) return orderList.value
  const q = searchQuery.value.toLowerCase()
  return orderList.value.filter(order =>
    (order.customerName && order.customerName.toLowerCase().includes(q)) ||
    (order.carModel && order.carModel.toLowerCase().includes(q))
  )
})

/**
 * 管理员更新状态 (如：待确认 -> 已确认)
 */
const handleUpdate = async (id, nextStatus) => {
  try {
    // 【核心修复】管理员更新时，必须传递完整的参数对象
    // 即使现在没有技师，也要传默认值，防止后端解析 workerId.toString() 时报空指针
    const params = {
      id: id,
      status: nextStatus,
      workerId: 0,       // 管理员确认时，ID设为0表示尚未分配
      workerName: ''     // 姓名设为空字符串
    }

    const res = await request.post('/api/appointment/updateStatus', params)

    if (res.success) {
      ElMessage.success(`订单已变更为: ${nextStatus}`)
      fetchOrders() // 刷新列表
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error('Update Error:', error)
    ElMessage.error('服务器响应异常，请检查后端日志')
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.order-card {
  margin: 20px;
  border-radius: 8px;
}

.header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.search-bar {
  margin-bottom: 20px;
}

.price-tag {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}
</style>
