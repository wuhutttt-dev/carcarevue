<template>
  <div class="history-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的预约历史</span>
          <el-button type="primary" size="small" @click="fetchHistory">刷新列表</el-button>
        </div>
      </template>

      <el-table :data="historyList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="appointmentTime" label="预约时间" width="180" />
        <el-table-column prop="carModel" label="车型" width="150" />
        <el-table-column prop="serviceType" label="服务项目" width="200" />

        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" show-overflow-tooltip />

        <el-table-column prop="cancelReason" label="取消原因" show-overflow-tooltip />

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === '待确认'"
              type="danger"
              size="small"
              @click="openCancelDialog(scope.row.id)"
            >取消</el-button>

            <el-button
              v-if="scope.row.status === '进行中' || scope.row.status === '服务中'"
              type="warning"
              size="small"
              @click="viewFaultDetail(scope.row.id)"
            >查看检查报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="cancelDialogVisible"
      title="取消预约"
      width="30%"
      @close="resetCancelForm"
    >
      <p style="margin-bottom: 10px;">请告诉我们需要取消的原因：</p>
      <el-input
        v-model="cancelReason"
        :rows="3"
        type="textarea"
        placeholder="例如：临时有事、计划变更..."
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialogVisible = false">暂不取消</el-button>
          <el-button type="primary" @click="submitCancel" :loading="submitting">
            确认取消
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="faultDialogVisible" title="技师检查报告" width="550px">
      <div v-if="currentFault" v-loading="loadingFault">
        <el-alert
          :title="currentFault.urgencyLevel === 2 ? '发现紧急安全隐患' : '发现建议维修项'"
          :type="currentFault.urgencyLevel === 2 ? 'error' : 'warning'"
          show-icon :closable="false"
        />

        <div style="margin-top: 20px;">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="建议维修项目">{{ currentFault.itemName }}</el-descriptions-item>
            <el-descriptions-item label="技师问题描述">{{ currentFault.workerRemark }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="currentFault.status === '已同意' ? 'success' : 'info'">
                {{ currentFault.status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div style="margin-top: 20px;">
          <p style="margin-bottom: 10px; font-weight: bold;">现场照片记录：</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <el-image
              v-for="(url, index) in faultImages"
              :key="index"
              :src="url"
              :preview-src-list="faultImages"
              style="width: 130px; height: 130px; border-radius: 8px; border: 1px solid #eee;"
              fit="cover"
            />
          </div>
          <p v-if="faultImages.length === 0" style="color: #999; font-size: 13px;">技师未上传照片</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="faultDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentFault?.status === '待确认'"
          type="primary"
          @click="handleAgree(currentFault.id)"
        >同意维修并更新订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const historyList = ref([])
const loading = ref(false)

// 取消预约相关变量
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const currentCancelId = ref(null)
const submitting = ref(false)

// 【新增】故障报告相关变量
const faultDialogVisible = ref(false)
const loadingFault = ref(false)
const currentFault = ref(null)
const faultImages = ref([])

// 1. 获取预约列表
const fetchHistory = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    // 如果没有用户信息，可以提示并跳转
    router.push('/login')
    return
  }

  const user = JSON.parse(userStr)
  if (!user.id) return

  loading.value = true
  try {
    // 这里的路径建议与后端确认。
    // 如果后端改成了“通过Token识别用户”，路径可以简化为 /api/appointment/my
    const res = await request.get(`/api/appointment/user/${user.id}`)

    if (res.success) {
      // 成功：res 就是 Result 对象，res.data 是 Appointment 列表
      historyList.value = res.data
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (err) {
    // 此时捕获的是非 401 的网络错误
    console.error('获取历史记录失败:', err)
  } finally {
    loading.value = false
  }
}

const getStatusTag = (status) => {
  const tagMap = {
    '待确认': 'info',
    '已确认': 'primary',
    '进行中': 'warning',
    '服务中': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return tagMap[status] || ''
}

// --- 【新增】故障报告逻辑 ---

/**
 * 获取特定预约单的故障隐患详情
 */
const viewFaultDetail = async (appointmentId) => {
  loadingFault.value = true
  try {
    // 调用后端接口：此处路径需与 Controller 定义一致
    const res = await request.get(`/api/faults/findByAppointment/${appointmentId}`)
    if (res.success) {
      currentFault.value = res.data
      // 解析后端用逗号拼接的图片字符串
      if (currentFault.value && currentFault.value.faultImages) {
        faultImages.value = currentFault.value.faultImages.split(',')
      } else {
        faultImages.value = []
      }
      faultDialogVisible.value = true
    } else {
      ElMessage.info('技师正在检查车辆，暂无异常报告')
    }
  } catch (error) {
    ElMessage.error('获取检查报告失败')
  } finally {
    loadingFault.value = false
  }
}

/**
 * 顾客同意维修逻辑
 */
const handleAgree = async (faultId) => {
  try {
    // 调用后端处理接口，对应 Service 中的 handleCustomerResponse 方法
    const res = await request.post(`/api/faults/handle?faultId=${faultId}&isAgreed=true`)
    if (res.success) {
      ElMessage.success('已确认维修项目，订单内容和价格已更新')
      faultDialogVisible.value = false
      fetchHistory() // 刷新列表以显示更新后的服务内容或价格
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('网络请求失败')
  }
}

// 原有取消逻辑
const openCancelDialog = (id) => {
  currentCancelId.value = id
  cancelReason.value = ''
  cancelDialogVisible.value = true
}

const resetCancelForm = () => {
  cancelReason.value = ''
  currentCancelId.value = null
}

const submitCancel = async () => {
  if (!cancelReason.value.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }

  submitting.value = true
  try {
    const payload = {
      id: currentCancelId.value,
      status: "已取消", // 状态码 4 代表已取消
      cancelReason: cancelReason.value
    }

    // 【修改 1】：将 request.put 替换为 request.post，并移除 http://localhost:8080
    // 这样请求头才会自动带上 Authorization Token
    const res = await request.post('/api/appointment/updateStatus', payload)

    // 【修改 2】：拦截器已返回 response.data，所以这里直接拿 res.success
    if (res.success || res.code === 200) {
      ElMessage.success('已取消预约')
      cancelDialogVisible.value = false
      fetchHistory() // 刷新列表
    } else {
      // 【修改 3】：报错提示也直接从 res 读取
      ElMessage.error(res.message || '取消失败')
    }
  } catch (e) {
    // 这里的 e 是网络错误或 401 拦截抛出的异常
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.history-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
