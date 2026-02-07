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
        <el-table-column prop="serviceType" label="服务项目" width="150" />

        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" show-overflow-tooltip />

        <el-table-column prop="cancelReason" label="取消原因" show-overflow-tooltip />

        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === '待确认'"
              type="danger"
              size="small"
              @click="openCancelDialog(scope.row.id)"
            >取消</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus' // 移除 ElMessageBox，改用 Dialog

const historyList = ref([])
const loading = ref(false)

// 【新增】弹窗相关变量
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const currentCancelId = ref(null)
const submitting = ref(false)

// 1. 获取预约列表
const fetchHistory = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return

  const user = JSON.parse(userStr)
  if (!user.id) return

  loading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/appointment/user/${user.id}`)
    if (res.data.success || res.data.code === 200) {
      historyList.value = res.data.data
    } else {
      ElMessage.error(res.data.message || '获取数据失败')
    }
  } catch (e) {
    console.error("API 请求失败:", e)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const getStatusTag = (status) => {
  const tagMap = {
    '待确认': 'info',
    '已确认': 'primary',
    '进行中': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return tagMap[status] || ''
}

// 【修改】点击列表中的取消按钮，只负责打开弹窗
const openCancelDialog = (id) => {
  currentCancelId.value = id
  cancelReason.value = '' // 清空之前的输入
  cancelDialogVisible.value = true
}

// 【新增】重置表单（关闭弹窗时触发）
const resetCancelForm = () => {
  cancelReason.value = ''
  currentCancelId.value = null
}

// 【新增】真正提交取消请求
const submitCancel = async () => {
  if (!cancelReason.value.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }

  submitting.value = true
  try {
    const payload = {
      id: currentCancelId.value,
      status: 4, // 对应后端的 "已取消"
      cancelReason: cancelReason.value // 把原因传给后端
    }

    const res = await axios.put('http://localhost:8080/api/appointment/updateStatus', payload)

    if (res.data.success || res.data.code === 200) {
      ElMessage.success('已取消预约')
      cancelDialogVisible.value = false // 关闭弹窗
      fetchHistory() // 刷新列表
    } else {
      ElMessage.error(res.data.message || '取消失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
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
